<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentCode;
use App\Models\PreEnrolledStudent;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EnrollmentController extends Controller
{
    /**
     * Submit a new enrollment application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitEnrollment(Request $request)
    {
        // Validate the request data
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
            
            // Process the data
            $data = $request->all();
            
            if ($request->hasFile('id_photo') && $request->file('id_photo')->isValid()) {
                $idPhotoPath = $request->file('id_photo')->store('identification', 's3'); 
                $data['id_photo'] = $idPhotoPath;
            }
            
            // Handle signature upload
            if ($request->hasFile('signature') && $request->file('signature')->isValid()) {
                $signaturePath = $request->file('signature')->store('identification', 's3'); 
                $data['signature'] = $signaturePath;
            }

            // Create pre-enrolled student record
            $preEnrolledStudent = PreEnrolledStudent::create($data);

            // Generate enrollment code
            $enrollmentCode = new EnrollmentCode([
                'code' => EnrollmentCode::generateUniqueCode(),
            ]);

            // Associate the enrollment code with the pre-enrolled student
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

    /**
     * Get all pre-enrolled students with course information.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPreEnrolledStudents()
    {
        try {
            $preEnrolledStudents = PreEnrolledStudent::with(['course.program', 'enrollmentCode'])
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

            return response()->json([
                'success' => true,
                'data' => $preEnrolledStudents,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pre-enrolled students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

   /**
     * Get a single pre-enrolled student with all details.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPreEnrolledStudentDetails($id)
    {
        try {
            $student = PreEnrolledStudent::with(['course.program', 'enrollmentCode'])->findOrFail($id);

            $student->id_photo_url = $student->id_photo ? Storage::disk('s3')->url($student->id_photo) : null;
            $student->signature_url = $student->signature ? Storage::disk('s3')->url($student->signature) : null;
            
            $subjectIds = $student->selected_subjects;
            $subjects = [];

            if (is_array($subjectIds) && count($subjectIds) > 0) {
                $subjects = \App\Models\Subject::with('schedules')
                    ->whereIn('id', $subjectIds)
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'subjects' => $subjects, // Subjects now contain their schedules
                    'approval_status' => [
                        'program_head_approved' => $student->program_head_approved,
                        'registrar_approved' => $student->registrar_approved,
                        'cashier_approved' => $student->cashier_approved,
                        'fully_approved' => $student->isFullyApproved(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Get the enrollment status based on approvals.
     *
     * @param  \App\Models\PreEnrolledStudent  $student
     * @return string
     */
    private function getEnrollmentStatus($student)
    {
        if ($student->isFullyApproved()) {
            return 'Approved';
        } elseif ($student->program_head_approved && $student->registrar_approved) {
            return 'Pending Payment';
        } elseif ($student->program_head_approved) {
            return 'Registrar Review';
        } else {
            return 'Program Head Review';
        }
    }

    /**
     * Calculate the enrollment progress percentage.
     *
     * @param  \App\Models\PreEnrolledStudent  $student
     * @return int
     */
    private function calculateProgress($student)
    {
        $steps = 3; // Total approval steps
        $completed = 0;
        
        if ($student->program_head_approved) $completed++;
        if ($student->registrar_approved) $completed++;
        if ($student->cashier_approved) $completed++;
        
        return ($completed / $steps) * 100;
    }

    public function updateApprovalStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|boolean',
            'field' => 'required|string|in:program_head,registrar,cashier',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        try {
            $student = PreEnrolledStudent::findOrFail($id);
            $fieldToUpdate = $request->input('field') . '_approved'; // e.g., 'program_head_approved'
            $userRole = $user->role;

            // Authorization logic based on user role
            $allowedToUpdate = false;
            switch ($userRole) {
                case 'Admin':
                    $allowedToUpdate = true;
                    break;
                case 'Program Head':
                    if ($fieldToUpdate === 'program_head_approved') {
                        $allowedToUpdate = true;
                    }
                    break;
                case 'Registrar':
                    // To enforce workflow, only allow update if program head has already approved
                    if ($fieldToUpdate === 'registrar_approved' && $student->program_head_approved) {
                        $allowedToUpdate = true;
                    }
                    break;
                case 'Cashier':
                     // Enforce workflow: only allow update if both head and registrar have approved
                    if ($fieldToUpdate === 'cashier_approved' && $student->program_head_approved && $student->registrar_approved) {
                        $allowedToUpdate = true;
                    }
                    break;
            }

            if (!$allowedToUpdate) {
                return response()->json(['success' => false, 'message' => 'You are not authorized to perform this action or prerequisites are not met.'], 403);
            }

            // Update and save the student record
            $student->{$fieldToUpdate} = $request->input('status');
            $student->save();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment status updated successfully.',
                'data' => $student,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'An error occurred.', 'error' => $e->getMessage()], 500);
        }
    }
}