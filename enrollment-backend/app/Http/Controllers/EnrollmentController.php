<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentCode;
use App\Models\PreEnrolledStudent;
use App\Models\EnrollmentApproval;
use App\Models\Course;
use App\Models\Grade;
use App\Models\User;
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
        $enrolledStudents = PreEnrolledStudent::with(['course', 'sections'])
            ->where('enrollment_status', 'enrolled')
            ->orderBy('student_id_number', 'asc')
            ->get()
            ->map(function ($student) {
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


}