<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PreEnrolledStudent;
use App\Models\UploadReceipt; // Changed from Payment
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class UploadReceiptController extends Controller
{

    public function index()
    {
        try {
            $receiptsByStudent = UploadReceipt::with('preEnrolledStudent')
                ->latest() // Important: ensures the first item in each group is the latest
                ->get()
                ->groupBy('pre_enrolled_student_id');

            $groupedData = $receiptsByStudent->map(function ($studentReceipts, $studentId) {
                $firstReceipt = $studentReceipts->first(); // This is the latest receipt

                if (!$firstReceipt || !$firstReceipt->preEnrolledStudent) {
                    return null; 
                }

                return [
                    'studentId' => $studentId,
                    'studentIdNumber' => $firstReceipt->preEnrolledStudent->student_id_number,
                    'studentName' => $firstReceipt->preEnrolledStudent->getFullNameAttribute(),
                    'latestUploadDate' => $firstReceipt->created_at->format('Y-m-d H:i'),
                    'receiptCount' => $studentReceipts->count(),
                    'receiptUrls' => $studentReceipts->map(function ($receipt) {
                        return Storage::disk('s3')->url($receipt->receipt_photo_path);
                    })->all(),
                ];
            })->filter()->values(); 

            return response()->json(['success' => true, 'data' => $groupedData]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch receipts', 'error' => $e->getMessage()], 500);
        }
    }


    public function searchStudents(Request $request)
    {
        $validator = Validator::make($request->all(), ['name' => 'required|string|min:2']);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $searchTerm = $request->input('name');
        
        $pendingStudents = PreEnrolledStudent::with(['course', 'enrollmentCode', 'enrollmentApprovals'])
            ->where('enrollment_status', 'pending')
            ->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%")
                      ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$searchTerm}%");
            })
            ->get();
            
        $filteredStudents = $pendingStudents->filter(function ($student) {
            $programHeadApproved = optional($student->getApprovalStatusFor('Program Head'))->status === 'approved';
            $registrarApproved = optional($student->getApprovalStatusFor('Registrar'))->status === 'approved';
            return $programHeadApproved && $registrarApproved;
        });

        $formattedData = $filteredStudents->map(function ($student) {
            return [
                'id' => $student->id,
                'fullName' => $student->getFullNameAttribute(),
                'course' => $student->course->course_name ?? 'N/A',
                'referenceNumber' => $student->enrollmentCode->code ?? 'N/A',
                'semester' => $student->semester,
                'schoolYear' => $student->school_year,
            ];
        });

        return response()->json(['success' => true, 'data' => $formattedData->values()]);
    }

    public function store(Request $request)
{
    // 1. Validate
    $validator = Validator::make($request->all(), [
        'student_id' => 'required|exists:pre_enrolled_students,id',
        'receipt_photo' => 'required|file|mimes:png,jpg,jpeg|max:5120',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
    }

    try {
        DB::beginTransaction();
        $student = PreEnrolledStudent::findOrFail($request->input('student_id'));
        
        $file = $request->file('receipt_photo');
        
        // Check if file is valid locally first
        if (!$file->isValid()) {
            throw new \Exception('File upload error: ' . $file->getErrorMessage());
        }
        $receiptPath = \Illuminate\Support\Facades\Storage::disk('s3')->putFile('identification', $file);

        // If the path is empty or false, we MANUALLY throw an error
        if ($receiptPath === false || empty($receiptPath)) {
            // This logs the specific S3 error to your storage/logs/laravel.log file
            throw new \Exception('S3 Upload returned false. Check laravel.log for "League\Flysystem" errors.');
        }

        UploadReceipt::create([
            'pre_enrolled_student_id' => $student->id,
            'receipt_photo_path' => $receiptPath,
        ]);
        
        DB::commit();

        return response()->json(['success' => true, 'message' => 'Receipt uploaded successfully.'], 201);
    } catch (\Exception $e) {
        DB::rollBack();
        // Log the full error so you can see it in storage/logs/laravel.log
        \Illuminate\Support\Facades\Log::error('Upload Error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Upload failed: ' . $e->getMessage()], 500);
    }
}
}