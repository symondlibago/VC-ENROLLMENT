<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
use App\Models\User;
use App\Models\Schedule;
use App\Models\Grade;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $instructors = Instructor::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $instructors]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email', // Check uniqueness in users table
            'password' => 'required|string|min:8|confirmed', // Add password validation
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $instructor = DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => 'instructor',
                ]);

                $instructorData = $request->except(['password', 'password_confirmation']);
                $instructor = $user->instructor()->create($instructorData);

                return $instructor;
            });

             return response()->json(['success' => true, 'message' => 'Instructor created successfully', 'data' => $instructor], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to create instructor.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        $instructor->load('user'); 
        return response()->json(['success' => true, 'data' => $instructor]);
    }

    public function getRoster(Request $request)
{
    // Get the currently authenticated user
    $user = $request->user();

    // Find the associated instructor profile, assuming a one-to-one or one-to-many relationship
    $instructor = Instructor::where('user_id', $user->id)->first();

    if (!$instructor) {
        return response()->json(['success' => false, 'message' => 'Instructor profile not found.'], 404);
    }

    // Eager load relationships to optimize queries
    // Instructor -> Schedules -> Subject -> Students
    $schedules = Schedule::with('subject.students')
                         ->where('instructor_id', $instructor->id)
                         ->get();

    // Organize the data by subject
    $rosterBySubject = [];
    foreach ($schedules as $schedule) {
        if ($schedule->subject) {
            $subjectId = $schedule->subject->id;

            // Avoid duplicating subjects if an instructor teaches multiple sections
            if (!isset($rosterBySubject[$subjectId])) {
                $rosterBySubject[$subjectId] = [
                    'subject_id' => $schedule->subject->id,
                    'subject_code' => $schedule->subject->subject_code,
                    'descriptive_title' => $schedule->subject->descriptive_title,
                    'students' => []
                ];
            }

            // Get students who are fully enrolled in this subject
            $enrolledStudents = $schedule->subject->students()
                ->where('enrollment_status', 'enrolled') // From pre_enrolled_students table
                ->get();

            foreach ($enrolledStudents as $student) {
                 // Format student data as needed by the frontend
                $rosterBySubject[$subjectId]['students'][$student->id] = [
                    'id' => $student->id,
                    'name' => $student->getFullNameAttribute(), // From PreEnrolledStudent model
                    'studentId' => $student->student_id_number,
                    'course' => $student->course->course_name ?? 'N/A',
                    'email' => $student->email_address,
                    'phone' => $student->contact_number,
                    'status' => 'Enrolled' // Based on the query filter
                ];
            }
        }
    }
     
    // Convert associative arrays to indexed arrays for JSON response
    $formattedRoster = [];
    foreach($rosterBySubject as $subjectData) {
        $subjectData['students'] = array_values($subjectData['students']);
        $formattedRoster[] = $subjectData;
    }

    return response()->json(['success' => true, 'data' => $formattedRoster]);
}

    // --- NEW METHOD ---
    public function getSchedule(Request $request)
    {
        $user = $request->user();
        $instructor = Instructor::where('user_id', $user->id)->first();

        if (!$instructor) {
            return response()->json(['success' => false, 'message' => 'Instructor profile not found.'], 404);
        }

        // Eager load the subject for each schedule
        $schedules = Schedule::with('subject')
                             ->where('instructor_id', $instructor->id)
                             ->get();

        // Format the data for the frontend
        $formattedSchedules = $schedules->map(function ($schedule) {
            return [
                'day' => $schedule->day,
                'time' => $schedule->time,
                'subject' => $schedule->subject->descriptive_title ?? 'Unassigned Subject',
                'code' => $schedule->subject->subject_code ?? 'N/A',
                'room' => $schedule->room_no,
                // Note: Section data is not directly available via this relationship.
                // We will omit it for now to match the available data model.
            ];
        });

        return response()->json(['success' => true, 'data' => $formattedSchedules]);
    }

    public function getGradeableStudents(Request $request)
    {
        $user = $request->user();
        $instructor = Instructor::where('user_id', $user->id)->first();

        if (!$instructor) {
            return response()->json(['success' => false, 'message' => 'Instructor profile not found.'], 404);
        }

        // Using the same roster logic to find the subjects and students
        $schedules = Schedule::with('subject.students.grades') // Eager load grades for students
                             ->where('instructor_id', $instructor->id)
                             ->get();

        $rosterBySubject = [];
        foreach ($schedules as $schedule) {
            if ($schedule->subject) {
                $subjectId = $schedule->subject->id;

                if (!isset($rosterBySubject[$subjectId])) {
                    $rosterBySubject[$subjectId] = [
                        'subject_id' => $schedule->subject->id,
                        'subject_code' => $schedule->subject->subject_code,
                        'descriptive_title' => $schedule->subject->descriptive_title,
                        'students' => []
                    ];
                }

                $enrolledStudents = $schedule->subject->students()
                    ->where('enrollment_status', 'enrolled')
                    ->get();

                foreach ($enrolledStudents as $student) {
                    $grade = $student->grades->where('subject_id', $subjectId)->first();

                    $rosterBySubject[$subjectId]['students'][$student->id] = [
                        'id' => $student->id,
                        'name' => $student->getFullNameAttribute(),
                        'studentId' => $student->student_id_number,
                        'grades' => [
                            'prelim_grade' => $grade->prelim_grade ?? null,
                            'midterm_grade' => $grade->midterm_grade ?? null,
                            'semifinal_grade' => $grade->semifinal_grade ?? null,
                            'final_grade' => $grade->final_grade ?? null,
                            'status' => $grade->status ?? 'In Progress',
                        ]
                    ];
                }
            }
        }
        
        $formattedRoster = array_map(function ($subjectData) {
            $subjectData['students'] = array_values($subjectData['students']);
            return $subjectData;
        }, array_values($rosterBySubject));

        // Fetch grading periods
        $gradingPeriods = \App\Models\GradingPeriod::all()->keyBy('name');

        return response()->json(['success' => true, 'data' => $formattedRoster, 'grading_periods' => $gradingPeriods]);
    }

    public function bulkUpdateGrades(Request $request)
    {
        $user = $request->user();
        $instructor = Instructor::where('user_id', $user->id)->first();

        if (!$instructor) {
            return response()->json(['success' => false, 'message' => 'Instructor profile not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:pre_enrolled_students,id',
            'grades.*.subject_id' => 'required|exists:subjects,id',
            'grades.*.prelim_grade' => 'nullable|numeric|min:1|max:5',
            'grades.*.midterm_grade' => 'nullable|numeric|min:1|max:5',
            'grades.*.semifinal_grade' => 'nullable|numeric|min:1|max:5',
            'grades.*.final_grade' => 'nullable|numeric|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $gradesData = $request->input('grades');

        try {
            DB::transaction(function () use ($gradesData, $instructor) {
                foreach ($gradesData as $gradeInput) {
                    // Authorization check: Ensure the instructor teaches this subject
                    $isAuthorized = Schedule::where("subject_id", $gradeInput["subject_id"])
                                            ->where("instructor_id", $instructor->id)
                                            ->exists();
                    
                    if (!$isAuthorized) {
                        // Silently skip if not authorized for this specific grade to prevent errors
                        continue;
                    }

                    // Date validation for each grade type
                    $currentDate = now()->toDateString();
                    $gradePeriodName = null;

                    if (isset($gradeInput["prelim_grade"]) && $gradeInput["prelim_grade"] !== null) {
                        $gradePeriodName = 'prelim';
                    } elseif (isset($gradeInput["midterm_grade"]) && $gradeInput["midterm_grade"] !== null) {
                        $gradePeriodName = 'midterm';
                    } elseif (isset($gradeInput["semifinal_grade"]) && $gradeInput["semifinal_grade"] !== null) {
                        $gradePeriodName = 'semifinal';
                    } elseif (isset($gradeInput["final_grade"]) && $gradeInput["final_grade"] !== null) {
                        $gradePeriodName = 'final';
                    }

                    if ($gradePeriodName) {
                        $gradingPeriod = \App\Models\GradingPeriod::where('name', $gradePeriodName)->first();

                        if ($gradingPeriod) {
                            $startDate = $gradingPeriod->start_date;
                            $endDate = $gradingPeriod->end_date;

                            if ($startDate && $endDate && ($currentDate < $startDate || $currentDate > $endDate)) {
                                // If outside the allowed period, skip this grade update and potentially log or return an error
                                // For now, we'll just skip to prevent submission. Frontend will handle disabling input.
                                continue;
                            }
                        }
                    }

                    $finalGrade = $gradeInput['final_grade'] ?? null;
                    
                    $status = 'In Progress';
                    if ($finalGrade !== null) {
                        $status = $finalGrade <= 3.0 ? 'Passed' : 'Failed';
                    }

                    Grade::updateOrCreate(
                        [
                            'pre_enrolled_student_id' => $gradeInput['student_id'],
                            'subject_id' => $gradeInput['subject_id'],
                        ],
                        [
                            'instructor_id' => $instructor->id,
                            'prelim_grade' => $gradeInput['prelim_grade'],
                            'midterm_grade' => $gradeInput['midterm_grade'],
                            'semifinal_grade' => $gradeInput['semifinal_grade'],
                            'final_grade' => $gradeInput['final_grade'],
                            'status' => $status,
                        ]
                    );
                }
            });

            return response()->json(['success' => true, 'message' => 'Grades submitted successfully.']);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'An error occurred while submitting grades.', 'error' => $e->getMessage()], 500);
        }
    }
  

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Instructor $instructor)
    {
        $user = $instructor->user; // Get the associated user

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::transaction(function () use ($request, $instructor, $user) {
                $user->update([
                    'name' => $request->name,
                    'email' => $request->email,
                ]);
                $instructor->update($request->all());
            });

            return response()->json(['success' => true, 'message' => 'Instructor updated successfully', 'data' => $instructor->fresh()]);

        } catch (\Exception $e) {
             return response()->json(['success' => false, 'message' => 'Failed to update instructor.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        $user = $instructor->user;

        if ($user) {
            $user->delete();
            return response()->json(['success' => true, 'message' => 'Instructor and associated user deleted successfully']);
        }
        
        $instructor->delete();
        return response()->json(['success' => true, 'message' => 'Instructor deleted successfully']);
    }
}