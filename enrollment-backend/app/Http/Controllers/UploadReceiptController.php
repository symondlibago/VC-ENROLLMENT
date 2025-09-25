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
            $receipts = UploadReceipt::with('preEnrolledStudent') // Eager load student data
                ->latest() // Show the newest receipts first
                ->get()
                ->map(function ($receipt) {
                    if (!$receipt->preEnrolledStudent) {
                        return null; // Skip if student relationship is broken
                    }
                    return [
                        'id' => $receipt->id,
                        'studentIdNumber' => $receipt->preEnrolledStudent->student_id_number,
                        'studentName' => $receipt->preEnrolledStudent->getFullNameAttribute(),
                        'uploadDate' => $receipt->created_at->format('Y-m-d H:i'),
                        'receiptUrl' => Storage::disk('s3')->url($receipt->receipt_photo_path),
                    ];
                })->filter(); // Remove null entries

            return response()->json(['success' => true, 'data' => $receipts]);
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
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:pre_enrolled_students,id',
            'receipt_photo' => 'required|file|mimes:png,jpg,jpeg|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $student = PreEnrolledStudent::findOrFail($request->input('student_id'));
            
            $receiptPath = $request->file('receipt_photo')->store('identification', 's3');

            // Use the new UploadReceipt model
            UploadReceipt::create([
                'pre_enrolled_student_id' => $student->id,
                'receipt_photo_path' => $receiptPath,
            ]);
            
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Receipt uploaded successfully for ' . $student->getFullNameAttribute()], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to upload receipt', 'error' => $e->getMessage()], 500);
        }
    }
}