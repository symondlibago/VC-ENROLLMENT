<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentCode;
use App\Models\PreEnrolledStudent;
use App\Models\EnrollmentApproval;
use App\Models\Course;
use App\Models\Grade;
use App\Models\User;
use App\Models\EnrollmentHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
class EnrollmentController extends Controller
{
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
    public function checkEnrollmentStatus($code): JsonResponse
    {
        // Eager load all necessary relationships to avoid multiple queries
        $enrollmentCode = EnrollmentCode::where('code', $code)->with([
            'preEnrolledStudent.course', 
            'preEnrolledStudent.enrollmentApprovals.user'
        ])->first();

        if (!$enrollmentCode || !$enrollmentCode->preEnrolledStudent) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or not found reference number.',
            ], 404);
        }

        $student = $enrollmentCode->preEnrolledStudent;

        // Prepare the data for the frontend
        $data = [
            'student' => [
                'fullName' => $student->getFullNameAttribute(),
                'course' => $student->course->course_name ?? 'N/A',
                'semester' => $student->semester,
                'schoolYear' => $student->school_year,
                'submissionDate' => $student->created_at->format('F d, Y'),
            ],
            'referenceNumber' => $enrollmentCode->code,
            'detailedStatus' => $this->getEnrollmentStatus($student),
            'lastUpdated' => $student->updated_at->format('F d, Y h:i A'),
            'approvals' => $student->enrollmentApprovals->map(function ($approval) {
                return [
                    'role' => $approval->role,
                    'status' => $approval->status,
                    'remarks' => $approval->remarks,
                    'processedBy' => $approval->user->name ?? 'System',
                    'date' => $approval->updated_at->format('M d, Y'),
                ];
            }),
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }


public function getPreEnrolledStudents()
{
    try {
        $user = Auth::user(); 

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $query = PreEnrolledStudent::with(['course.program', 'enrollmentCode', 'enrollmentApprovals'])
                                  ->orderBy('created_at', 'desc');

        switch ($user->role) {
            case 'Program Head':
                $query->whereDoesntHave('enrollmentApprovals', function ($q) {
                    $q->where('status', 'approved');
                });
                break;
            case 'Registrar':
                $query->whereHas('enrollmentApprovals', function ($q) {
                    $q->where('role', 'Program Head')->where('status', 'approved');
                })->whereDoesntHave('enrollmentApprovals', function ($q) {
                    $q->where('role', 'Registrar')->where('status', 'approved');
                });
                break;
            case 'Cashier':
                $query->whereHas('enrollmentApprovals', function ($q) {
                    $q->where('role', 'Program Head')->where('status', 'approved');
                })->whereHas('enrollmentApprovals', function ($q) {
                    $q->where('role', 'Registrar')->where('status', 'approved');
                })->whereDoesntHave('enrollmentApprovals', function ($q) {
                    $q->where('role', 'Cashier')->where('status', 'approved');
                });
                break;
        }

        if ($user->role !== 'Admin') {
            $query->where('enrollment_status', '!=', 'enrolled');
        }
        $preEnrolledStudents = $query->get()->map(function ($student) {
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
            ];
        });

        return response()->json(['success' => true, 'data' => $preEnrolledStudents]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Failed to fetch pre-enrolled students', 'error' => $e->getMessage()], 500);
    }
}

public function getPreEnrolledStudentDetails($id): JsonResponse
    {
        try {
            $student = PreEnrolledStudent::with([
                'course.program', 
                'enrollmentCode', 
                'enrollmentApprovals', 
                'subjects.schedules',
                'grades',
                'subjectChangeRequests.items.subject'
            ])->findOrFail($id);

            $student->id_photo_url = $student->id_photo ? Storage::disk('s3')->url($student->id_photo) : null;
            $student->signature_url = $student->signature ? Storage::disk('s3')->url($student->signature) : null;
            
            $subjects = $student->subjects;

            // ✅ FIXED: Filter out dropped subjects that the student has already passed.
            $passedSubjectIds = $student->grades()->where('status', 'Passed')->pluck('subject_id');
            
            $droppedSubjects = $student->subjectChangeRequests
                ->where('status', 'approved')
                ->flatMap(fn($req) => $req->items)
                ->where('action', 'drop')
                ->map(fn($item) => $item->subject)
                ->whereNotNull()
                ->unique('id')
                ->whereNotIn('id', $passedSubjectIds) // The crucial filter
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'subjects' => $subjects,
                    'grades' => $student->grades,
                    'dropped_subjects' => $droppedSubjects,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch student details', 'error' => $e->getMessage()], 500);
        }
    }

    private function getEnrollmentStatus($student)
    {
        if ($student->enrollment_status === 'enrolled') {
            return 'Enrolled';
        }
        if ($student->enrollment_status === 'rejected') {
            return 'Rejected';
        }

        $programHeadApproved = optional($student->getApprovalStatusFor('Program Head'))->status === 'approved';
        $registrarApproved = optional($student->getApprovalStatusFor('Registrar'))->status === 'approved';

        if ($programHeadApproved && $registrarApproved) {
            return 'Pending Payment';
        }
        if ($programHeadApproved) {
            return 'Registrar Review';
        }
        return 'Program Head Review';
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
        // 1. Eager load program and grades for efficiency
        $enrolledStudents = PreEnrolledStudent::with([
                'course.program', // <-- Added program to the eager load
                'sections', 
                'grades', 
                'shifteeRequests', 
                'subjectChangeRequests.items'
            ])
            ->where('enrollment_status', 'enrolled')
            ->orderBy('student_id_number', 'asc')
            ->get();

        // Get all course IDs from the student list to fetch curriculum subjects in one go
        $courseIds = $enrolledStudents->pluck('course_id')->unique()->filter();
        $allCurriculumSubjects = \App\Models\Subject::whereIn('course_id', $courseIds)->get()->groupBy('course_id');

        $enrolledStudents = $enrolledStudents->map(function ($student) use ($allCurriculumSubjects) {

            $hasFailedSubjects = $student->grades->where('status', 'Failed')->isNotEmpty();
            $isApprovedShiftee = $student->shifteeRequests->where('status', 'approved')->isNotEmpty();
            
            $hasDroppedSubjects = $student->subjectChangeRequests
                ->where('status', 'approved')
                ->contains(function ($request) {
                    return $request->items->where('action', 'drop')->isNotEmpty();
                });

            // ✅ NEW: Logic to check for missed summer subjects
            $hasMissedSummerSubjects = false;
            if ($student->course && $student->course->program && $student->course->program->program_code === 'Diploma') {
                
                $passedSubjectIds = $student->grades->where('status', 'Passed')->pluck('subject_id');
                $curriculum = $allCurriculumSubjects->get($student->course_id) ?? collect();

                // Simple numeric value for year comparison (e.g., '2nd Year' -> 2, '1st Year Summer' -> 1.5)
                $getYearValue = function ($yearStr) {
                    if (str_contains($yearStr, 'Summer')) {
                        return (int)filter_var($yearStr, FILTER_SANITIZE_NUMBER_INT) + 0.5;
                    }
                    return (int)filter_var($yearStr, FILTER_SANITIZE_NUMBER_INT);
                };
                
                $studentYearValue = $getYearValue($student->year);

                // Check for 1st Year Summer if student is in 2nd year or higher
                if ($studentYearValue >= 2) {
                    $summer1Subjects = $curriculum->where('year', '1st Year Summer');
                    if ($summer1Subjects->isNotEmpty() && $summer1Subjects->pluck('id')->diff($passedSubjectIds)->isNotEmpty()) {
                        $hasMissedSummerSubjects = true;
                    }
                }

                // Check for 2nd Year Summer if student is in 3rd year or higher
                if (!$hasMissedSummerSubjects && $studentYearValue >= 3) {
                    $summer2Subjects = $curriculum->where('year', '2nd Year Summer');
                    if ($summer2Subjects->isNotEmpty() && $summer2Subjects->pluck('id')->diff($passedSubjectIds)->isNotEmpty()) {
                        $hasMissedSummerSubjects = true;
                    }
                }
            }


            $currentAcademicStatus = 'Regular';
            // 3. Update the final if statement with the new condition
            if ($hasFailedSubjects || $isApprovedShiftee || $hasDroppedSubjects || $hasMissedSummerSubjects) {
                $currentAcademicStatus = 'Irregular';
            }

            return [
                'id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'name' => $student->getFullNameAttribute(),
                'email' => $student->email_address,
                'year' => $student->year,
                'courseId' => $student->course->id ?? null,
                'courseName' => $student->course ? $student->course->course_name : 'N/A',
                'sectionId' => $student->sections->first()->id ?? null,
                'sectionName' => $student->sections->isNotEmpty() ? $student->sections->first()->name : 'Unassigned',
                'academic_status' => $currentAcademicStatus,
            ];
        });

        return response()->json(['success' => true, 'data' => $enrolledStudents]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Failed to fetch enrolled students', 'error' => $e->getMessage()], 500);
    }
}

public function updateStudentDetails(Request $request, $id)
{
    $user = Auth::user();

    // Authorization: Only Admin or Registrar can update details
    if (!$user || !in_array($user->role, ['Admin', 'Registrar'])) {
        return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    // Find the student or fail
    $student = PreEnrolledStudent::findOrFail($id);

    // EXPANDED Validation rules to include all editable fields
    $validator = Validator::make($request->all(), [
        // Basic Info
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
        'email_address' => 'required|email|max:255|unique:pre_enrolled_students,email_address,' . $student->id,
        
        // Parent Info
        'father_name' => 'nullable|string|max:255',
        'father_occupation' => 'nullable|string|max:255',
        'father_contact_number' => 'nullable|string|max:255',
        'mother_name' => 'nullable|string|max:255',
        'mother_occupation' => 'nullable|string|max:255',
        'mother_contact_number' => 'nullable|string|max:255',
        'parents_address' => 'nullable|string|max:255',
        
        // Emergency Contact
        'emergency_contact_name' => 'required|string|max:255',
        'emergency_contact_number' => 'required|string|max:255',
        'emergency_contact_address' => 'required|string|max:255',
        
        // Educational Background
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
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422);
    }

    try {
        // Update the student with all validated data
        $student->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Student details updated successfully.',
            'data' => $student,
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to update student details.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function getStudentsForIdReleasing()
{
    try {
        $students = PreEnrolledStudent::with('course')
            ->where('enrollment_status', 'enrolled')
            ->orderBy('student_id_number', 'asc') 
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_id_number' => $student->student_id_number,
                    'name' => $student->getFullNameAttribute(),
                    'courseName' => $student->course ? $student->course->course_name : 'N/A',
                    'id_photo_url' => $student->id_photo ? Storage::disk('s3')->url($student->id_photo) : null,
                    'signature_url' => $student->signature ? Storage::disk('s3')->url($student->signature) : null,
                    'id_status' => $student->id_status,
                    'id_printed_at' => $student->id_printed_at,
                    'id_released_at' => $student->id_released_at,
                    'emergency_contact_name' => $student->emergency_contact_name,
                    'emergency_contact_number' => $student->emergency_contact_number,
                    'emergency_contact_address' => $student->emergency_contact_address,
                ];
            });

        return response()->json(['success' => true, 'data' => $students]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Failed to fetch students for ID releasing', 'error' => $e->getMessage()], 500);
    }
}

        public function updateIdStatus(Request $request, $id)
        {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:printed,released',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }
            
            try {
                $student = PreEnrolledStudent::findOrFail($id);
                $status = $request->input('status');

                if ($status === 'printed') {
                    $student->id_status = 'Printed';
                    $student->id_printed_at = Carbon::now();
                } elseif ($status === 'released') {
                    $student->id_status = 'Released';
                    // Also set printed date if it's not already set
                    if (!$student->id_printed_at) {
                        $student->id_printed_at = Carbon::now();
                    }
                    $student->id_released_at = Carbon::now();
                }
                
                $student->save();

                return response()->json(['success' => true, 'message' => 'ID status updated successfully.']);

            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Failed to update ID status', 'error' => $e->getMessage()], 500);
            }
        }

        public function bulkUpdateIdStatus(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:pre_enrolled_students,id', // Ensure all IDs are valid
                'status' => 'required|string|in:printed', // For now, only allow 'printed' for bulk actions
            ]);
    
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }
    
            try {
                $studentIds = $request->input('student_ids');
                $status = $request->input('status');
    
                if ($status === 'printed') {
                    // Use a single query to update all students at once
                    PreEnrolledStudent::whereIn('id', $studentIds)
                        ->where(function ($query) {
                            // Optional: Only update those that are not yet printed or released
                            $query->where('id_status', '!=', 'Printed')
                                  ->orWhereNull('id_status');
                        })
                        ->update([
                            'id_status' => 'Printed',
                            'id_printed_at' => Carbon::now(),
                        ]);
                }
    
                return response()->json(['success' => true, 'message' => 'Bulk ID status updated successfully.']);
    
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Failed to bulk update ID status', 'error' => $e->getMessage()], 500);
            }
        }


            /**
     * Get grades for a specific student, filterable by year and semester.
     */
    public function getStudentGrades(Request $request, PreEnrolledStudent $student): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'nullable|string',
                'semester' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            // Start querying grades for the specific student
            $query = Grade::with([
                // Eager load relationships and select only the columns you need for optimization
                'subject:id,subject_code,descriptive_title,year,semester',
                'instructor.user:id,name'
            ])->where('pre_enrolled_student_id', $student->id);

            // Apply filters by querying the related 'subject' table
            $query->whereHas('subject', function ($q) use ($request) {
                if ($request->filled('year')) {
                    $q->where('year', $request->year);
                }
                if ($request->filled('semester')) {
                    $q->where('semester', $request->semester);
                }
            });

            $grades = $query->orderBy('created_at', 'desc')->get();

            // Format the data for a clean frontend response
            $formattedGrades = $grades->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'subject_code' => $grade->subject->subject_code ?? 'N/A',
                    'descriptive_title' => $grade->subject->descriptive_title ?? 'N/A',
                    'instructor_name' => $grade->instructor->user->name ?? 'Unassigned',
                    'prelim_grade' => $grade->prelim_grade,
                    'midterm_grade' => $grade->midterm_grade,
                    'semifinal_grade' => $grade->semifinal_grade,
                    'final_grade' => $grade->final_grade,
                    'status' => $grade->status,
                    'year' => $grade->subject->year,
                    'semester' => $grade->subject->semester,
                ];
            });

            return response()->json(['success' => true, 'data' => $formattedGrades]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student grades.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStudentGrades(Request $request)
    {
        // 1. Authorization: Only Admin and Registrar can access
        $user = Auth::user(); 
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // 2. Validation
        $validator = Validator::make($request->all(), [
            'grades' => 'required|array',
            'grades.*.id' => 'required|exists:grades,id',
            'grades.*.final_grade' => 'nullable|numeric|min:1|max:5',
            'grades.*.status' => ['required', 'string', Rule::in(['Passed', 'Failed', 'In Progress', 'INC', 'NFE', 'NFR', 'DA'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // 3. Database Transaction
        try {
            DB::transaction(function () use ($request) {
                foreach ($request->grades as $gradeData) {
                    $grade = Grade::find($gradeData['id']);
                    if ($grade) {
                        if (array_key_exists('final_grade', $gradeData)) {
                            $grade->final_grade = $gradeData['final_grade'];
                        }
                        
                        $grade->status = $gradeData['status'];
                        $grade->save();
                    }
                }
            });

            return response()->json(['success' => true, 'message' => 'Grades updated successfully.']);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'An error occurred while updating grades.', 'error' => $e->getMessage()], 500);
        }
    }
    
     /**
     * NEW: Get enrolled subjects for the authenticated student user.
     */
    public function getStudentEnrolledSubjects(Request $request): JsonResponse
{
    try {
        $user = Auth::user();

        $student = PreEnrolledStudent::where('user_id', $user->id)
            ->where('enrollment_status', 'enrolled')
            ->first();

        if (!$student) {
            return response()->json(['success' => true, 'data' => []]);
        }

        // --- MODIFIED --- We only need to eager load the instructor, not the user.
        $enrolledSubjects = $student->subjects()->with(['schedules.instructor'])->get();

        $formattedSubjects = $enrolledSubjects->map(function ($subject) use ($student) {
            
            $schedulesArray = $subject->schedules->map(function ($schedule) {
                return [
                    'day' => $schedule->day,
                    'time' => $schedule->time,
                ];
            })->all();

            // --- MODIFIED --- Get the name directly from the instructor object.
            $instructorName = $subject->schedules->first()?->instructor?->name ?? 'TBA';
            $room = $subject->schedules->first()?->room_no ?? 'TBA';

            return [
                'id' => $subject->id,
                'subject_code' => $subject->subject_code,
                'descriptive_title' => $subject->descriptive_title,
                'units' => $subject->total_units,
                'semester' => $student->semester,
                'school_year' => $student->school_year,
                'status' => 'Enrolled',
                'instructor' => $instructorName,
                'schedules' => $schedulesArray,
                'room' => $room,
            ];
        });

        return response()->json(['success' => true, 'data' => $formattedSubjects]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'An unexpected error occurred.',
            'error' => $e->getMessage()
        ], 500);
    }
}

 /**
     * NEW: Get grades for the currently authenticated student user.
     */
    public function getAuthenticatedStudentGrades(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $student = PreEnrolledStudent::where('user_id', $user->id)->first();

            if (!$student) {
                return response()->json(['success' => true, 'data' => []]);
            }
            
            // 1. Start by querying ALL grades associated with the student.
            $gradesQuery = Grade::with(['subject', 'instructor.user']) // Eager load needed details
                               ->where('pre_enrolled_student_id', $student->id);

            // 2. Apply filters (if any) by checking the related subject's properties.
            $gradesQuery->whereHas('subject', function ($q) use ($request) {
                if ($request->filled('year') && $request->year !== 'all') {
                    $q->where('year', 'like', '%' . $request->year . '%');
                }
                if ($request->filled('semester') && $request->semester !== 'all') {
                    $q->where('semester', $request->semester);
                }
            });

            // 3. Retrieve the filtered grades.
            $grades = $gradesQuery->orderBy('created_at', 'desc')->get();

            // 4. Format the data for a clean frontend response.
            $formattedData = $grades->map(function ($grade) {
                if (!$grade->subject) {
                    return null; // Skip if a grade is missing its subject for some reason
                }

                return [
                    'id' => $grade->id,
                    'subject_code' => $grade->subject->subject_code,
                    'descriptive_title' => $grade->subject->descriptive_title,
                    'units' => $grade->subject->total_units,
                    'instructor_name' => $grade->instructor->user->name ?? 'Unassigned',
                    'prelim_grade' => $grade->prelim_grade,
                    'midterm_grade' => $grade->midterm_grade,
                    'semifinal_grade' => $grade->semifinal_grade,
                    'final_grade' => $grade->final_grade,
                    'status' => $grade->status ?? 'In Progress',
                ];
            })->filter()->values(); // filter() removes any nulls, values() re-indexes the array.

            return response()->json(['success' => true, 'data' => $formattedData]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve your grades.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * NEW: Get the full curriculum for the currently authenticated student's course.
     */
    public function getStudentCurriculum(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            // Eager load relationships needed for curriculum and dropped subjects
            $student = PreEnrolledStudent::with(['course.program', 'grades', 'subjectChangeRequests.items.subject'])->where('user_id', $user->id)->first();

            if (!$student || !$student->course_id) {
                return response()->json(['success' => false, 'message' => 'No course found for your account.'], 404);
            }

            $subjects = \App\Models\Subject::where('course_id', $student->course_id)
                ->with('prerequisite:id,subject_code')
                ->orderBy('year')
                ->orderBy('semester')
                ->get();

            // ✅ ADDED: Logic to get dropped subjects for the student panel
            $droppedSubjects = $student->subjectChangeRequests
                ->where('status', 'approved')
                ->flatMap(fn($req) => $req->items)
                ->where('action', 'drop')
                ->map(fn($item) => $item->subject)
                ->whereNotNull()
                ->unique('id')
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'course_name' => $student->course->course_name,
                    'program_code' => $student->course->program->program_code,
                    'subjects' => $subjects,
                    'grades' => $student->grades,
                    'dropped_subjects' => $droppedSubjects, // Include in response
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve curriculum records.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * NEW: Get the full weekly schedule for the authenticated student.
     */
    public function getStudentSchedule(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $student = PreEnrolledStudent::where('user_id', $user->id)
                ->where('enrollment_status', 'enrolled')
                ->first();

            if (!$student) {
                return response()->json(['success' => true, 'data' => []]);
            }

            // Get the IDs of all subjects the student is enrolled in
            $subjectIds = $student->subjects()->pluck('subjects.id');

            // Find all schedules linked to those subjects
            $schedules = \App\Models\Schedule::with(['subject', 'instructor'])
                ->whereIn('subject_id', $subjectIds)
                ->get();
            
            // Format the data for a clean response
            $formattedSchedules = $schedules->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'day' => $schedule->day,
                    'time' => $schedule->time,
                    'room_no' => $schedule->room_no,
                    'subject_code' => $schedule->subject->subject_code ?? 'N/A',
                    'descriptive_title' => $schedule->subject->descriptive_title ?? 'N/A',
                    'instructor_name' => $schedule->instructor->name ?? 'TBA',
                ];
            });

            return response()->json(['success' => true, 'data' => $formattedSchedules]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve your schedule.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Methods for continuing students

    public function searchEnrolledStudents(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'search' => 'required|string|min:2',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $searchTerm = $request->input('search');

    $students = PreEnrolledStudent::with('course:id,course_name')
        ->where('enrollment_status', 'enrolled')
        ->where(function ($query) use ($searchTerm) {
            $query->where('student_id_number', 'like', '%' . $searchTerm . '%')
                ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', '%' . $searchTerm . '%')
                ->orWhere(DB::raw("CONCAT(last_name, ' ', first_name)"), 'like', '%' . $searchTerm . '%');
        })
        ->select('id', 'student_id_number', 'first_name', 'last_name', 'middle_name', 'course_id', 'year', 'semester')
        ->limit(10)
        ->get();

    return response()->json(['success' => true, 'data' => $students]);
}

/**
 * Submit enrollment for a continuing student.
 * This creates a new pre_enrolled_students record with updated term info.
 */
public function submitContinuingEnrollment(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'original_student_id' => 'required|exists:pre_enrolled_students,id',
        'year' => 'required|string',
        'semester' => 'required|string',
        'school_year' => 'required|string',
        'selected_subjects' => 'required|array',
        'selected_subjects.*' => 'exists:subjects,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    try {
        DB::beginTransaction();
        $student = PreEnrolledStudent::with('subjects')->findOrFail($request->input('original_student_id'));

        $subjectsFromLastTerm = $student->subjects->map(fn($subject) => [
            'subject_code' => $subject->subject_code,
            'descriptive_title' => $subject->descriptive_title,
            'total_units' => $subject->total_units,
        ]);

        if ($subjectsFromLastTerm->isNotEmpty()) {
            EnrollmentHistory::create([
                'pre_enrolled_student_id' => $student->id,
                'course_id' => $student->course_id,
                'semester' => $student->semester,
                'school_year' => $student->school_year,
                'year' => $student->year,
                'enrollment_type' => $student->enrollment_type,
                'academic_status' => $student->academic_status,
                'subjects_taken' => $subjectsFromLastTerm,
            ]);
        }

        $student->year = $request->input('year');
        $student->semester = $request->input('semester');
        $student->school_year = $request->input('school_year');
        $student->enrollment_type = 'Continuing';
        $student->enrollment_status = 'pending';
        $student->enrollmentApprovals()->delete();
        $student->save();

        $student->subjects()->sync($request->input('selected_subjects'));
        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Student re-enrolled successfully. Previous term has been archived.',
            'data' => ['student' => $student->fresh()],
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Failed to submit continuing enrollment.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function checkEnrollmentEligibility(Request $request, PreEnrolledStudent $student): JsonResponse
    {
        try {
            // This part checks for ungraded subjects in the current term (no changes)
            $enrolledSubjects = $student->subjects;
            $subjectIds = $enrolledSubjects->pluck('id');
            if ($subjectIds->isNotEmpty()) {
                $grades = Grade::where('pre_enrolled_student_id', $student->id)
                              ->whereIn('subject_id', $subjectIds)
                              ->get()->keyBy('subject_id');
                
                $ungradedSubjects = [];
                foreach ($enrolledSubjects as $subject) {
                    $grade = $grades->get($subject->id);
                    if (!$grade || $grade->status === 'In Progress' || is_null($grade->final_grade)) {
                        $ungradedSubjects[] = ['subject_code' => $subject->subject_code, 'descriptive_title' => $subject->descriptive_title];
                    }
                }
                
                if (!empty($ungradedSubjects)) {
                    return response()->json([
                        'success' => true, 
                        'eligible' => false,
                        'message' => 'Student has ungraded subjects from the current term.',
                        'ungraded_subjects' => $ungradedSubjects
                    ]);
                }
            }

            
            // 1. Get IDs of all subjects the student has ALREADY PASSED.
            $passedSubjectIds = $student->grades()->where('status', 'Passed')->pluck('subject_id');

            // 2. Get FAILED subjects that have not been subsequently passed.
            $failedSubjects = $student->grades()
                ->where('status', 'Failed')->with('subject')->get()
                ->map(fn($grade) => $grade->subject)->whereNotNull()
                ->whereNotIn('id', $passedSubjectIds)->unique('id')->values();
            
            // 3. Get DROPPED subjects that have not been subsequently passed.
            $droppedSubjects = $student->subjectChangeRequests()
                ->where('status', 'approved')->with('items.subject')->get()
                ->flatMap(fn($req) => $req->items)->where('action', 'drop')
                ->map(fn($item) => $item->subject)->whereNotNull()
                ->unique('id')->whereNotIn('id', $passedSubjectIds)->values();

            // 4. Return all necessary data for validation on the frontend.
            return response()->json([
                'success' => true, 
                'eligible' => true,
                'passed_subject_ids' => $passedSubjectIds, 
                'retakeable_subjects' => [
                    'failed' => $failedSubjects,
                    'dropped' => $droppedSubjects,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'An error occurred while checking eligibility.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
 * NEW: Get the authenticated student's academic status and next term info.
 */
public function getStudentEnrollmentEligibilityStatus(Request $request): JsonResponse
{
    try {
        $user = Auth::user();
        
        // Find the student profile associated with the authenticated user
        $student = PreEnrolledStudent::with([
            'course.program', 
            'grades', 
            'shifteeRequests', 
            'subjectChangeRequests.items.subject.prerequisite',
            'subjects.prerequisite'
        ])
            ->where('user_id', $user->id)
            ->where('enrollment_status', 'enrolled')
            ->first();

        if (!$student) {
            return response()->json([
                'success' => true,
                'status_data' => [
                    'academic_status' => 'Ineligible',
                    'message' => 'Your enrollment status is not currently "Enrolled".',
                    'next_term' => ['year' => 'N/A', 'semester' => 'N/A', 'schoolYear' => 'N/A'],
                    'ungraded_subjects' => [],
                    'retakeable_subjects' => ['failed' => [], 'dropped' => []],
                    'student_id' => null,
                ]
            ]);
        }
        
        // --- 1. Check for Ungraded Subjects (Makes them INELIGIBLE TO PROCEED) ---
        $enrolledSubjects = $student->subjects;
        $subjectIds = $enrolledSubjects->pluck('id');
        $ungradedSubjects = [];
        
        if ($subjectIds->isNotEmpty()) {
            $grades = Grade::where('pre_enrolled_student_id', $student->id)
                          ->whereIn('subject_id', $subjectIds)
                          ->get()->keyBy('subject_id');
            
                          foreach ($enrolledSubjects as $subject) {
                            $grade = $grades->get($subject->id);
                            // Check if grade is missing or marked as 'In Progress' or final_grade is null
                            if (!$grade || $grade->status === 'In Progress' || is_null($grade->final_grade)) {
                                $ungradedSubjects[] = [
                                    'subject_code' => $subject->subject_code ?? 'N/A', 
                                    'descriptive_title' => $subject->descriptive_title ?? 'N/A'
                                ];
                            }
                        }
        }
        
        if (!empty($ungradedSubjects)) {
             // Ineligible case: Cannot enroll until grades are posted
             return response()->json([
                'success' => true,
                'status_data' => [
                    'academic_status' => 'Ineligible',
                    'message' => 'You have ungraded subjects from the current term.',
                    'next_term' => ['year' => $student->year, 'semester' => $student->semester, 'schoolYear' => $student->school_year],
                    'ungraded_subjects' => $ungradedSubjects,
                    'retakeable_subjects' => ['failed' => [], 'dropped' => []],
                    'student_id' => $student->id,
                ]
            ]);
        }

        // --- 2. Determine Academic Status (Regular/Irregular) ---
        
        // Get IDs of all subjects the student has ALREADY PASSED.
        $passedSubjectIds = $student->grades()->where('status', 'Passed')->pluck('subject_id');

        // Get FAILED subjects that have not been subsequently passed.
        $failedSubjects = $student->grades()
            ->where('status', 'Failed')->with('subject.prerequisite')->get()
            ->map(fn($grade) => $grade->subject)->whereNotNull()
            ->whereNotIn('id', $passedSubjectIds)->unique('id')->values();
        
        // Get DROPPED subjects that have not been subsequently passed.
        $droppedSubjects = $student->subjectChangeRequests()
            ->where('status', 'approved')->with('items.subject.prerequisite')->get()
            ->flatMap(fn($req) => $req->items)->where('action', 'drop')
            ->map(fn($item) => $item->subject)->whereNotNull()
            ->unique('id')->whereNotIn('id', $passedSubjectIds)->values();

        // NOTE: The missing summer subject check from getEnrolledStudents can be optionally added here.
        // For now, we will use the failed/dropped subjects to define Irregular status.
        $isIrregular = $failedSubjects->isNotEmpty() || $droppedSubjects->isNotEmpty();
        $academicStatus = $isIrregular ? 'Irregular' : 'Regular';
        
        // --- 3. Determine Next Term Info (Simple example: increment year/semester) ---
        // NOTE: This logic should ideally be handled by a service layer. Using simple hardcoded values for now.
        $nextTerm = $this->calculateNextTerm(
            $student->year, 
            $student->semester, 
            $student->school_year,
            $student->course->program->program_code ?? 'Bachelor',
        ); 
        
        return response()->json([
            'success' => true,
            'status_data' => [
                'academic_status' => $academicStatus,
                'message' => 'Enrollment status check complete.',
                'next_term' => $nextTerm, 
                'ungraded_subjects' => $ungradedSubjects,
                'retakeable_subjects' => [
                    'failed' => $failedSubjects->map(fn($s) => [
                        'id' => $s->id, 
                        'subject_code' => $s->subject_code, 
                        'descriptive_title' => $s->descriptive_title
                    ])->all(),
                    'dropped' => $droppedSubjects->map(fn($s) => [
                        'id' => $s->id, 
                        'subject_code' => $s->subject_code, 
                        'descriptive_title' => $s->descriptive_title
                    ])->all(),
                ],
                'student_id' => $student->id,
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'An error occurred while checking eligibility.',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * NEW: Get subjects for a specific course, year, and semester for the authenticated student.
 */
public function getSubjectsForNextTerm(Request $request): JsonResponse
{
    try {
        $user = Auth::user();
        $student = PreEnrolledStudent::where('user_id', $user->id)
            ->where('enrollment_status', 'enrolled')
            ->first();

        // 1. Validate the request and check for student enrollment status
        if (!$student || !$student->course_id) {
            return response()->json(['success' => false, 'message' => 'Student course data not found or enrollment is not complete.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'year' => 'required|string',
            'semester' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // 2. Fetch subjects for the student's course and the requested term
        $subjects = \App\Models\Subject::where('course_id', $student->course_id)
            ->where('year', $request->input('year'))
            ->where('semester', $request->input('semester'))
            ->with('prerequisite:id,subject_code') // Eager load prerequisite for frontend display
            ->get();

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to retrieve subjects for the term.',
            'error' => $e->getMessage()
        ], 500);
    }
}





// HELPER FUNCTION RETAIN IT HERE FOR NOW ---------------------------------------------------------------------------------------

/**
 * Helper to calculate the next sequential term based on the current term.
 * Assumes a standard progression: 1st Sem -> 2nd Sem -> [Summer] -> Next Year 1st Sem.
 *
 * @param string $currentYear The current year (e.g., '1st Year', '1st Year Summer')
 * @param string $currentSemester The current semester (e.g., '1st Semester', '2nd Semester')
 * @param string $currentSchoolYear The current school year (e.g., '2024-2025')
 * @param string $programCode The student's program code (e.g., 'Diploma', 'Bachelor')
 * @return array
 */
private function calculateNextTerm(string $currentYear, string $currentSemester, string $currentSchoolYear, string $programCode = 'Bachelor'): array
{
    // Define the correct year progression order
    $yearOrder = [
        '1st Year' => 1,
        '2nd Year' => 2,
        '3rd Year' => 3,
        '4th Year' => 4,
    ];

    // Define the Diploma program's special summer progression
    $diplomaSummerTerms = [
        '1st Year 2nd Semester' => '1st Year Summer',
        '1st Year Summer 1st Semester' => '2nd Year', // Next main year
        '2nd Year 2nd Semester' => '2nd Year Summer',
        '2nd Year Summer 1st Semester' => '3rd Year', // Next main year
    ];
    
    // Check for max year (e.g., 4th Year 2nd Sem -> Graduation)
    if (str_contains($currentYear, '4th Year') && $currentSemester === '2nd Semester') {
         return [
            'year' => 'Graduated', 
            'semester' => 'N/A', 
            'schoolYear' => $currentSchoolYear,
         ];
    }
    
    $currentTerm = $currentYear . ' ' . $currentSemester;

    // --- DIPLOMA PROGRAM LOGIC ---
    if ($programCode === 'Diploma') {
        // Handle Summer progression
        if (isset($diplomaSummerTerms[$currentTerm])) {
            $nextYearString = $diplomaSummerTerms[$currentTerm];
            $nextSemester = $nextYearString === '1st Year Summer' || $nextYearString === '2nd Year Summer' ? '1st Semester' : '1st Semester';
            
            // Check if we are advancing the main academic year (e.g., 1st Year Summer -> 2nd Year)
            if (str_contains($nextYearString, 'Year') && !str_contains($nextYearString, 'Summer')) {
                 list($start, $end) = explode('-', $currentSchoolYear);
                 $nextSchoolYear = (int)$start + 1 . '-' . (int)$end + 1;
            } else {
                 $nextSchoolYear = $currentSchoolYear;
            }

            return [
                'year' => $nextYearString,
                'semester' => $nextSemester,
                'schoolYear' => $nextSchoolYear,
            ];
        }

        // Handle standard term progression (e.g., 1st Sem -> 2nd Sem)
        if ($currentSemester === '1st Semester') {
            return [
                'year' => $currentYear,
                'semester' => '2nd Semester',
                'schoolYear' => $currentSchoolYear,
            ];
        }
        
        // After 2nd Semester of 3rd or 4th Year (Diploma only has 3 years, but for safety)
        if ($currentSemester === '2nd Semester' && !str_contains($currentYear, 'Summer')) {
            $currentYearInt = $yearOrder[$currentYear] ?? 0;
            $nextYearInt = $currentYearInt + 1;
            
            $nextYearString = array_search($nextYearInt, $yearOrder) ?: $currentYear;

            list($start, $end) = explode('-', $currentSchoolYear);
            $nextSchoolYear = (int)$start + 1 . '-' . (int)$end + 1;
            
            return [
                'year' => $nextYearString,
                'semester' => '1st Semester',
                'schoolYear' => $nextSchoolYear,
            ];
        }

    } 
    // --- NON-DIPLOMA (Bachelor) LOGIC ---
    else {
        if ($currentSemester === '1st Semester') {
            $nextSemester = '2nd Semester';
            $nextYear = $currentYear;
            $nextSchoolYear = $currentSchoolYear;
        } else { // 2nd Semester
            $currentYearInt = $yearOrder[$currentYear] ?? 0;
            $nextYearInt = $currentYearInt + 1;

            $nextYearMap = array_flip($yearOrder);
            $nextYear = $nextYearMap[$nextYearInt] ?? $currentYear;

            $nextSemester = '1st Semester';
            
            // Increment school year: '2024-2025' -> '2025-2026'
            list($start, $end) = explode('-', $currentSchoolYear);
            $nextSchoolYear = (int)$start + 1 . '-' . (int)$end + 1;
        }

        return [
            'year' => $nextYear,
            'semester' => $nextSemester,
            'schoolYear' => $nextSchoolYear,
        ];
    }
    
    // Default fallback to prevent a crash
    return [
        'year' => $currentYear,
        'semester' => $currentSemester,
        'schoolYear' => $currentSchoolYear,
    ];
}

}