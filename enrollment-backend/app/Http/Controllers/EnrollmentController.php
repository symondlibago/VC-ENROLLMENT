<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentCode;
use App\Models\PreEnrolledStudent;
use App\Models\EnrollmentApproval;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EnrollmentController extends Controller
{
    // submitEnrollment, getPreEnrolledStudents, getPreEnrolledStudentDetails...
    // ... (No changes to submitEnrollment, getPreEnrolledStudents, getPreEnrolledStudentDetails from previous step)
    public function submitEnrollment(Request $request)
    {
        // ... same validation as before
        $validator = Validator::make($request->all(), [
            'course_id' => 'required|exists:courses,id',
            'last_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'gender' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'birth_place' => 'required|string|max:255',
            'nationality' => 'required|string|max:255',
            'civil_status' => 'required|string|max:255',
            'religion' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|max:255',
            'email_address' => 'required|email|max:255',
            'father_name' => 'nullable|string|max:255',
            'father_occupation' => 'nullable|string|max:255',
            'father_contact_number' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_occupation' => 'nullable|string|max:255',
            'mother_contact_number' => 'nullable|string|max:255',
            'parents_address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_number' => 'required|string|max:255',
            'emergency_contact_address' => 'required|string|max:255',
            'elementary' => 'nullable|string|max:255',
            'elementary_date_completed' => 'nullable|string|max:255',
            'junior_high_school' => 'nullable|string|max:255',
            'junior_high_date_completed' => 'nullable|string|max:255',
            'senior_high_school' => 'nullable|string|max:255',
            'senior_high_date_completed' => 'nullable|string|max:255',
            'high_school_non_k12' => 'nullable|string|max:255',
            'high_school_non_k12_date_completed' => 'nullable|string|max:255',
            'college' => 'nullable|string|max:255',
            'college_date_completed' => 'nullable|string|max:255',
            'id_photo' => 'nullable|file|mimes:png|max:5120', // 5MB max size, PNG only
            'signature' => 'nullable|file|mimes:png|max:5120', // 5MB max size, PNG only
            'semester' => 'required|string|max:255',
            'school_year' => 'required|string|max:255',
            'year' => 'required|string|max:255',
            'enrollment_type' => 'required|string|max:255',
            'selected_subjects' => 'required|array',
            'selected_subjects.*' => 'exists:subjects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $data = $request->all();
            $data = $request->except('selected_subjects');
            
            if ($request->hasFile('id_photo') && $request->file('id_photo')->isValid()) {
                $idPhotoPath = $request->file('id_photo')->store('identification', 's3'); 
                $data['id_photo'] = $idPhotoPath;
            }
            
            if ($request->hasFile('signature') && $request->file('signature')->isValid()) {
                $signaturePath = $request->file('signature')->store('identification', 's3'); 
                $data['signature'] = $signaturePath;
            }

            $preEnrolledStudent = PreEnrolledStudent::create($data);

            if ($request->has('selected_subjects')) {
                $preEnrolledStudent->subjects()->attach($request->input('selected_subjects'));
            }

            $enrollmentCode = new EnrollmentCode([
                'code' => EnrollmentCode::generateUniqueCode(),
            ]);

            $preEnrolledStudent->enrollmentCode()->save($enrollmentCode);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment submitted successfully',
                'data' => [
                    'student' => $preEnrolledStudent,
                    'enrollment_code' => $enrollmentCode->code,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit enrollment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check enrollment status by code.
     *
     * @param  string  $code
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkEnrollmentStatus($code)
    {
        $enrollmentCode = EnrollmentCode::where('code', $code)->first();

        if (!$enrollmentCode) {
            return response()->json([
                'success' => false,
                'message' => 'Enrollment code not found',
            ], 404);
        }

        $preEnrolledStudent = $enrollmentCode->preEnrolledStudent;

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $preEnrolledStudent,
                'enrollment_code' => $enrollmentCode->code,
                'approval_status' => [
                    'program_head_approved' => $preEnrolledStudent->program_head_approved,
                    'registrar_approved' => $preEnrolledStudent->registrar_approved,
                    'cashier_approved' => $preEnrolledStudent->cashier_approved,
                    'fully_approved' => $preEnrolledStudent->isFullyApproved(),
                ],
            ],
        ]);
    }


    public function getPreEnrolledStudents()
    {
        try {
            $preEnrolledStudents = PreEnrolledStudent::with(['course.program', 'enrollmentCode', 'enrollmentApprovals'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'student_id_number' => $student->student_id_number,
                        'name' => $student->getFullNameAttribute(),
                        'email' => $student->email_address,
                        'contact' => $student->contact_number,
                        'course' => $student->course ? $student->course->course_name : null,
                        'course_code' => $student->course ? $student->course->course_code : null,
                        'program' => $student->course && $student->course->program ? $student->course->program->program_name : null,
                        'enrollment_date' => $student->created_at->format('Y-m-d'),
                        'semester' => $student->semester,
                        'school_year' => $student->school_year,
                        'enrollment_type' => $student->enrollment_type,
                        'status' => $this->getEnrollmentStatus($student),
                        'progress' => $this->calculateProgress($student),
                        'enrollment_code' => $student->enrollmentCode ? $student->enrollmentCode->code : null,
                        'gender' => $student->gender,
                        // Include only necessary fields for the table view
                    ];
                });

            return response()->json(['success' => true, 'data' => $preEnrolledStudents]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch pre-enrolled students', 'error' => $e->getMessage()], 500);
        }
    }

    public function getPreEnrolledStudentDetails($id)
    {
        try {
            $student = PreEnrolledStudent::with([
                'course.program', 
                'enrollmentCode', 
                'enrollmentApprovals', 
                'subjects.schedules'
            ])->findOrFail($id);

            $student->id_photo_url = $student->id_photo ? Storage::disk('s3')->url($student->id_photo) : null;
            $student->signature_url = $student->signature ? Storage::disk('s3')->url($student->signature) : null;
            

            $subjects = $student->subjects;

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'subjects' => $subjects, // This now contains the correct data
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch student details', 'error' => $e->getMessage()], 500);
        }
    }

    private function getEnrollmentStatus($student)
    {
        // The main status column is now the primary source of truth.
        if ($student->enrollment_status === 'enrolled') {
            return 'Enrolled';
        }
        if ($student->enrollment_status === 'rejected') {
            return 'Rejected';
        }

        // For "pending" status, provide more detail on the current step for the UI.
        $programHeadApproved = optional($student->getApprovalStatusFor('Program Head'))->status === 'approved';
        $registrarApproved = optional($student->getApprovalStatusFor('Registrar'))->status === 'approved';

        if ($programHeadApproved && $registrarApproved) {
            return 'Pending Payment'; // Waiting for Cashier
        }
        if ($programHeadApproved) {
            return 'Registrar Review'; // Waiting for Registrar
        }
        return 'Program Head Review'; // Waiting for Program Head
    }

    private function calculateProgress($student)
    {
        $approvedCount = $student->enrollmentApprovals->where('status', 'approved')->count();
        return ($approvedCount / 3) * 100;
    }

    public function submitApproval(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:approved,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $student = PreEnrolledStudent::with('enrollmentApprovals')->findOrFail($id);
        $userRole = $user->role;

        // Authorization & Workflow Logic (no changes here)
        $isAuthorized = false;
        $programHeadApproval = $student->getApprovalStatusFor('Program Head');
        $registrarApproval = $student->getApprovalStatusFor('Registrar');

        switch ($userRole) {
            case 'Admin':
            case 'Program Head':
                if ($userRole === 'Program Head' || $userRole === 'Admin') $isAuthorized = true;
                break;
            case 'Registrar':
                if (optional($programHeadApproval)->status === 'approved') $isAuthorized = true;
                break;
            case 'Cashier':
                if (optional($programHeadApproval)->status === 'approved' && optional($registrarApproval)->status === 'approved') $isAuthorized = true;
                break;
        }

        if (!$isAuthorized) {
            return response()->json(['success' => false, 'message' => 'You are not authorized or prerequisites are not met.'], 403);
        }
        
        try {
            $approval = EnrollmentApproval::updateOrCreate(
                ['pre_enrolled_student_id' => $student->id, 'role' => $userRole],
                ['user_id' => $user->id, 'status' => $request->input('status'), 'remarks' => $request->input('remarks')]
            );
            
            // --- LOGIC TO UPDATE THE MAIN STUDENT STATUS ---
            $student->load('enrollmentApprovals'); // Refresh approvals relationship

            $programHeadStatus = optional($student->getApprovalStatusFor('Program Head'))->status;
            $registrarStatus = optional($student->getApprovalStatusFor('Registrar'))->status;
            $cashierStatus = optional($student->getApprovalStatusFor('Cashier'))->status;

            if ($programHeadStatus === 'rejected' || $registrarStatus === 'rejected' || $cashierStatus === 'rejected') {
                $student->enrollment_status = 'rejected';
            } elseif ($programHeadStatus === 'approved' && $registrarStatus === 'approved' && $cashierStatus === 'approved') {
                $student->enrollment_status = 'enrolled';
            } else {
                $student->enrollment_status = 'pending';
            }
            $student->save();
            // --- END OF NEW LOGIC ---

            return response()->json([
                'success' => true,
                'message' => 'Approval status updated successfully.',
                'data' => [
                    'approval' => $approval->load('user'),
                    'student_status' => $student->enrollment_status
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'An error occurred.', 'error' => $e->getMessage()], 500);
        }
    }


public function getEnrolledStudents()
{
    try {
        $enrolledStudents = PreEnrolledStudent::with(['course', 'sections'])
            ->where('enrollment_status', 'enrolled')
            ->orderBy('last_name', 'asc')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_id_number' => $student->student_id_number,
                    'name' => $student->getFullNameAttribute(),
                    'email' => $student->email_address,
                    'courseId' => $student->course->id ?? null,
                    'courseName' => $student->course ? $student->course->course_name : 'N/A',
                    'sectionId' => $student->sections->first()->id ?? null,
                    'sectionName' => $student->sections->isNotEmpty() ? $student->sections->first()->name : 'Unassigned',
                ];
            });

        return response()->json(['success' => true, 'data' => $enrolledStudents]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Failed to fetch enrolled students', 'error' => $e->getMessage()], 500);
    }
}
}

