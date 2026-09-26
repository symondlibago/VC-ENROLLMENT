<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
use App\Models\User;
use App\Models\Schedule;
use App\Models\Grade;
use App\Models\PreEnrolledStudent;
use App\Models\Section;
use App\Models\Subject;
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

            // Get students who are fully enrolled in this subject AND NOT withdrawn
            $enrolledStudents = $schedule->subject->students()
                ->where('enrollment_status', 'enrolled') // From pre_enrolled_students table
                ->where('academic_status', '!=', 'Withdraw') // ✅ **ADDED THIS FILTER**
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

        // Eager load the subject and section for each schedule
        $schedules = Schedule::with(['subject', 'section'])
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
                'section' => $schedule->section->name ?? null,
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

    // Optional term filter — without it the roster covers every term
    $schoolYear = $request->query('school_year');
    $semester   = $request->query('semester');

    $schedules = Schedule::with('subject', 'section')
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
                    'lec_hrs' => $schedule->subject->lec_hrs,
                    'lab_hrs' => $schedule->subject->lab_hrs,
                    'total_units' => $schedule->subject->total_units,
                    'number_of_hours' => $schedule->subject->number_of_hours,
                    'schedule_info' => "{$schedule->day} {$schedule->time}",
                    'room' => $schedule->room_no,
                    'school_year' => 'N/A',
                    'semester' => $schedule->subject->semester,
                    'students' => []
                ];
            }

            // FIX: Only fetch students belonging to this schedule's specific section.
            // If the schedule has no section_id (general schedule), fetch all enrolled students.
            $studentsQuery = $schedule->subject->students()
                ->with(['sections', 'grades' => fn($q) => $q->where('subject_id', $subjectId), 'course'])
                ->where('enrollment_status', 'enrolled')
                ->where('academic_status', '!=', 'Withdraw');

            if ($schedule->section_id) {
                // Scope to only students who belong to this schedule's section
                $studentsQuery->whereHas('sections', fn($q) => $q->where('sections.id', $schedule->section_id));
            }

            // When a past term is being viewed, the students currently sitting in
            // the section belong to a different term and must not be mixed in.
            if ($schoolYear) $studentsQuery->where('school_year', $schoolYear);
            if ($semester)   $studentsQuery->where('semester', $semester);

            $enrolledStudents = $studentsQuery->get();

            foreach ($enrolledStudents as $student) {
                // Skip if this student was already added by another schedule for this subject
                // (guards against duplicate entries when a student appears in multiple schedules)
                if (isset($rosterBySubject[$subjectId]['students'][$student->id])) {
                    continue;
                }

                if ($rosterBySubject[$subjectId]['school_year'] === 'N/A') {
                    $rosterBySubject[$subjectId]['school_year'] = $student->school_year;
                }

                // Use the schedule's assigned section name, not the student's first section.
                // This ensures the section shown matches the instructor's schedule context.
                $sectionName = $schedule->section ? $schedule->section->name
                    : ($student->sections->isNotEmpty() ? $student->sections->first()->name : 'Unassigned');

                $grade = $student->grades->first();

                $rosterBySubject[$subjectId]['students'][$student->id] = [
                    'id' => $student->id,
                    'name' => $student->getFullNameAttribute(),
                    'studentId' => $student->student_id_number,
                    'year' => $student->year,
                    'courseCode' => $student->course->course_code ?? 'N/A',
                    'courseName' => $student->course->course_name ?? 'N/A',
                    'section' => $sectionName,
                    'section_id' => $schedule->section_id,
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
    
    // Students already graded in a past term are no longer attached to the
    // subject or its section (re-enrollment re-syncs both), so they are added
    // back from their own grade records, which carry the term and section.
    $pastGrades = Grade::with(['student.course', 'section', 'subject'])
        ->where('instructor_id', $instructor->id)
        ->whereNotNull('school_year')
        ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
        ->when($semester, fn ($q) => $q->where('semester', $semester))
        ->get();

    foreach ($pastGrades as $grade) {
        $student = $grade->student;
        if (!$student || !$grade->subject) continue;

        $subjectId = $grade->subject_id;
        if (!isset($rosterBySubject[$subjectId])) {
            $rosterBySubject[$subjectId] = [
                'subject_id' => $subjectId,
                'subject_code' => $grade->subject->subject_code,
                'descriptive_title' => $grade->subject->descriptive_title,
                'lec_hrs' => $grade->subject->lec_hrs,
                'lab_hrs' => $grade->subject->lab_hrs,
                'total_units' => $grade->subject->total_units,
                'number_of_hours' => $grade->subject->number_of_hours,
                'schedule_info' => 'TBA',
                'room' => null,
                'school_year' => $grade->school_year,
                'semester' => $grade->semester ?? $grade->subject->semester,
                'students' => [],
            ];
        }

        if (isset($rosterBySubject[$subjectId]['students'][$student->id])) continue;

        $rosterBySubject[$subjectId]['students'][$student->id] = [
            'id' => $student->id,
            'name' => $student->getFullNameAttribute(),
            'studentId' => $student->student_id_number,
            'year' => $grade->year ?? $student->year,
            'courseCode' => $student->course->course_code ?? 'N/A',
            'courseName' => $student->course->course_name ?? 'N/A',
            'section' => $grade->section->name ?? 'Unassigned',
            'section_id' => $grade->section_id,
            'school_year' => $grade->school_year,
            'semester' => $grade->semester,
            'grades' => [
                'prelim_grade' => $grade->prelim_grade,
                'midterm_grade' => $grade->midterm_grade,
                'semifinal_grade' => $grade->semifinal_grade,
                'final_grade' => $grade->final_grade,
                'status' => $grade->status ?? 'In Progress',
            ],
        ];
    }

    $formattedRoster = array_map(function ($subjectData) {
        $subjectData['students'] = array_values($subjectData['students']);
        return $subjectData;
    }, array_values($rosterBySubject));

    $gradingPeriods = \App\Models\GradingPeriod::all()->keyBy('name');

    // Terms this instructor has grades for, so the page can offer a term filter
    $availableTerms = Grade::where('instructor_id', $instructor->id)
        ->whereNotNull('school_year')
        ->select('school_year', 'semester')
        ->distinct()
        ->get()
        ->map(fn ($g) => ['school_year' => $g->school_year, 'semester' => $g->semester])
        ->sortByDesc(fn ($t) => $t['school_year'] . '|' . $t['semester'])
        ->values();

    return response()->json([
        'success' => true,
        'data' => $formattedRoster,
        'grading_periods' => $gradingPeriods,
        'available_terms' => $availableTerms,
    ]);
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
            'grades.*.prelim_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.midterm_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.semifinal_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.final_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.status' => ['nullable', 'string', Rule::in(['Passed', 'Failed', 'In Progress', 'INC', 'NFE', 'NFR', 'DA'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $gradesData = $request->input('grades');
        $gradingPeriods = \App\Models\GradingPeriod::all()->keyBy('name');

        // Loaded once so each grade can be stamped with the student's current term
        $students = PreEnrolledStudent::whereIn('id', collect($gradesData)->pluck('student_id'))
            ->get(['id', 'school_year', 'semester', 'year'])
            ->keyBy('id');

        try {
            // Keep track of students whose grades were updated
            $affectedStudentIds = []; 

            // Use a single database transaction for the entire operation
            DB::transaction(function () use ($gradesData, $instructor, $gradingPeriods, $students, &$affectedStudentIds) {
                
                // 1. UPDATE ALL THE GRADES
                foreach ($gradesData as $gradeInput) {
                    // Authorization check: the instructor must teach this subject to the
                    // student's own section (or have a general, section-less schedule),
                    // matching the roster built in getGradeableStudents().
                    $studentSectionIds = DB::table('section_student')
                        ->where('pre_enrolled_student_id', $gradeInput['student_id'])
                        ->pluck('section_id');

                    $teachesStudent = Schedule::where('subject_id', $gradeInput['subject_id'])
                        ->where('instructor_id', $instructor->id)
                        ->where(fn ($q) => $q->whereIn('section_id', $studentSectionIds)->orWhereNull('section_id'))
                        ->exists();

                    if (!$teachesStudent) {
                        continue;
                    }

                    // Find the existing grade record or create a new one
                    $grade = Grade::firstOrNew([
                        'pre_enrolled_student_id' => $gradeInput['student_id'],
                        'subject_id' => $gradeInput['subject_id'],
                    ]);

                    // The instructor saving the grade is the one who teaches this student,
                    // so keep the record in sync (fixes rows stamped by a previous instructor).
                    if ($grade->status !== 'Credited') {
                        $grade->instructor_id = $instructor->id;

                        // Stamp the term and section this grade belongs to. Without it the
                        // student vanishes from this roster the moment they re-enroll, since
                        // re-enrollment re-syncs student_subject and section_student.
                        $student = $students->get($gradeInput['student_id']);
                        if ($student) {
                            $grade->school_year = $student->school_year;
                            $grade->semester    = $student->semester;
                            $grade->year        = $student->year;
                        }

                        $sectionId = Schedule::where('subject_id', $gradeInput['subject_id'])
                            ->where('instructor_id', $instructor->id)
                            ->whereIn('section_id', $studentSectionIds)
                            ->value('section_id');
                        if ($sectionId) {
                            $grade->section_id = $sectionId;
                        }
                    }

                    $now = now();
                    
                    // --- FIXED LOGIC: Use startOfDay() and endOfDay() for accurate time checking ---
                    $prelimPeriod = $gradingPeriods->get('prelim');
                    if (array_key_exists('prelim_grade', $gradeInput) && $prelimPeriod) {
                        $start = \Carbon\Carbon::parse($prelimPeriod->start_date)->startOfDay();
                        $end = \Carbon\Carbon::parse($prelimPeriod->end_date)->endOfDay();
                        if ($now->between($start, $end)) {
                            $grade->prelim_grade = $gradeInput['prelim_grade'];
                        }
                    }

                    $midtermPeriod = $gradingPeriods->get('midterm');
                    if (array_key_exists('midterm_grade', $gradeInput) && $midtermPeriod) {
                        $start = \Carbon\Carbon::parse($midtermPeriod->start_date)->startOfDay();
                        $end = \Carbon\Carbon::parse($midtermPeriod->end_date)->endOfDay();
                        if ($now->between($start, $end)) {
                            $grade->midterm_grade = $gradeInput['midterm_grade'];
                        }
                    }

                    $semifinalPeriod = $gradingPeriods->get('semifinal');
                    if (array_key_exists('semifinal_grade', $gradeInput) && $semifinalPeriod) {
                        $start = \Carbon\Carbon::parse($semifinalPeriod->start_date)->startOfDay();
                        $end = \Carbon\Carbon::parse($semifinalPeriod->end_date)->endOfDay();
                        if ($now->between($start, $end)) {
                            $grade->semifinal_grade = $gradeInput['semifinal_grade'];
                        }
                    }

                    $finalPeriod = $gradingPeriods->get('final');
                    if (array_key_exists('final_grade', $gradeInput) && $finalPeriod) {
                        $start = \Carbon\Carbon::parse($finalPeriod->start_date)->startOfDay();
                        $end = \Carbon\Carbon::parse($finalPeriod->end_date)->endOfDay();
                        if ($now->between($start, $end)) {
                            $grade->final_grade = $gradeInput['final_grade'];
                        }
                    }
                    // --- END OF FIXED LOGIC ---

                    // Status: an explicit remark from the instructor wins; an existing
                    // remark (INC and friends) is preserved rather than being
                    // recomputed away; otherwise it follows the final grade.
                    $specialStatuses = ['INC', 'NFE', 'NFR', 'DA', 'Credited'];

                    if (!empty($gradeInput['status'])) {
                        $grade->status = $gradeInput['status'];
                    } elseif (!in_array($grade->status, $specialStatuses, true)) {
                        if ($grade->final_grade !== null) {
                            $grade->status = $grade->final_grade >= 75 ? 'Passed' : 'Failed';
                        } else {
                            $grade->status = 'In Progress';
                        }
                    }

                    $grade->save();

                    // Marking a grade INC opens its record on the INC page
                    \App\Services\IncRecordService::syncForGrade($grade);

                    // If any grade was changed, add the student's ID to our list for the next step
                    if ($grade->wasChanged()) {
                        $affectedStudentIds[] = $grade->pre_enrolled_student_id;
                    }
                }

                // --- 2. UPDATE ACADEMIC STATUS FOR AFFECTED STUDENTS ---
                $uniqueAffectedStudentIds = array_unique($affectedStudentIds);
        
                foreach ($uniqueAffectedStudentIds as $studentId) {
                    // Check if this student has ANY failed subjects
                    $hasFailedSubjects = Grade::where('pre_enrolled_student_id', $studentId)
                                              ->where('status', 'Failed')
                                              ->exists();
        
                    // Find the student and update their status
                    $student = PreEnrolledStudent::find($studentId);
                    if ($student) {
                        $student->academic_status = $hasFailedSubjects ? 'Irregular' : 'Regular';
                        $student->save();
                    }
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

    /**
     * ADMIN ONLY: Get the roster for a specific instructor.
     */
    /**
     * Roster for one instructor, used by the admin "Export Grading Sheet" modal.
     *
     * A student who has already re-enrolled for the next term is no longer in
     * last term's section, so the live section membership alone loses them. The
     * roster is therefore built from two sources per subject + section:
     *   1. students currently in that section, and
     *   2. students whose grade record for that subject is stamped with it.
     *
     * Optional ?school_year= and ?semester= narrow the roster to one term.
     */
    public function getInstructorRoster($instructorId, Request $request)
    {
        $instructor = Instructor::findOrFail($instructorId);
        $schoolYear = $request->query('school_year');
        $semester   = $request->query('semester');

        $schedules = Schedule::with(['subject', 'section'])
                             ->where('instructor_id', $instructor->id)
                             ->get();

        // Every grade this instructor has given, keyed by subject then section.
        // Section may be null on older records whose section could not be
        // established; those are surfaced under "Unassigned Section" instead of
        // being dropped.
        $gradeQuery = Grade::with(['student.course', 'section'])
            ->where('instructor_id', $instructor->id);
        if ($schoolYear) $gradeQuery->where('school_year', $schoolYear);
        if ($semester)   $gradeQuery->where('semester', $semester);
        $grades = $gradeQuery->get();

        $gradesBySubjectSection = $grades->groupBy(fn ($g) => "{$g->subject_id}|" . ($g->section_id ?? 'none'));

        $formatStudent = function ($student, $grade, $sectionName) {
            return [
                'student_id' => $student->student_id_number,
                'name' => $student->getFullNameAttribute(),
                'course' => $student->course->course_code ?? 'N/A',
                'year' => $grade->year ?? $student->year,
                'gender' => $student->gender,
                'section' => $sectionName,
                'school_year' => $grade->school_year ?? $student->school_year,
                'semester' => $grade->semester ?? $student->semester,
                'grades' => [
                    'prelim_grade' => $grade->prelim_grade ?? null,
                    'midterm_grade' => $grade->midterm_grade ?? null,
                    'semifinal_grade' => $grade->semifinal_grade ?? null,
                    'final_grade' => $grade->final_grade ?? null,
                    'status' => $grade->status ?? 'In Progress',
                ],
            ];
        };

        $rosterData = [];
        $seenSubjectSections = [];

        foreach ($schedules as $schedule) {
            if (!$schedule->subject) continue;

            $subjectId   = $schedule->subject->id;
            $sectionName = $schedule->section ? $schedule->section->name : 'All Sections';
            $key         = "{$subjectId}|" . ($schedule->section_id ?? 'none');

            // Several schedules can share a subject + section (different days);
            // the roster only needs one entry per pair.
            if (isset($seenSubjectSections[$key])) continue;
            $seenSubjectSections[$key] = true;

            $students = [];

            // 1. Students currently sitting in this section
            $currentQuery = PreEnrolledStudent::with(['course', 'grades' => fn ($q) => $q->where('subject_id', $subjectId)])
                ->whereHas('subjects', fn ($q) => $q->where('subjects.id', $subjectId))
                ->where('academic_status', '!=', 'Withdraw');

            if ($schedule->section_id) {
                $currentQuery->whereHas('sections', fn ($q) => $q->where('sections.id', $schedule->section_id));
            }
            if ($schoolYear) $currentQuery->where('school_year', $schoolYear);
            if ($semester)   $currentQuery->where('semester', $semester);

            foreach ($currentQuery->get() as $student) {
                $students[$student->id] = $formatStudent($student, $student->grades->first(), $sectionName);
            }

            // 2. Students whose grade for this subject is stamped with this section —
            //    including any who have since moved on to another term
            foreach ($gradesBySubjectSection->get($key, collect()) as $grade) {
                if (!$grade->student || isset($students[$grade->student->id])) continue;
                $students[$grade->student->id] = $formatStudent($grade->student, $grade, $sectionName);
            }

            $rosterData[] = [
                'subject_id' => $schedule->subject->id,
                'subject_code' => $schedule->subject->subject_code,
                'descriptive_title' => $schedule->subject->descriptive_title,
                'schedule_time' => $schedule->day . ' ' . $schedule->time,
                'room' => $schedule->room_no,
                'lec_hrs' => $schedule->subject->lec_hrs,
                'lab_hrs' => $schedule->subject->lab_hrs,
                'total_units' => $schedule->subject->total_units,
                'number_of_hours' => $schedule->subject->number_of_hours,
                'semester' => $semester ?: $schedule->subject->semester,
                'school_year' => $schoolYear ?: $schedule->subject->school_year,
                'section_name' => $sectionName,
                'students' => array_values($students),
            ];
        }

        // 3. Older grades whose section could not be established still need a home,
        //    otherwise those students are invisible to the export.
        foreach ($grades->whereNull('section_id')->groupBy('subject_id') as $subjectId => $subjectGrades) {
            $subject = $subjectGrades->first()->subject ?? Subject::find($subjectId);
            if (!$subject) continue;

            $students = [];
            foreach ($subjectGrades as $grade) {
                if (!$grade->student) continue;
                $students[$grade->student->id] = $formatStudent($grade->student, $grade, 'Unassigned Section');
            }
            if (!$students) continue;

            $rosterData[] = [
                'subject_id' => $subject->id,
                'subject_code' => $subject->subject_code,
                'descriptive_title' => $subject->descriptive_title,
                'schedule_time' => 'TBA',
                'room' => null,
                'lec_hrs' => $subject->lec_hrs,
                'lab_hrs' => $subject->lab_hrs,
                'total_units' => $subject->total_units,
                'number_of_hours' => $subject->number_of_hours,
                'semester' => $semester ?: $subject->semester,
                'school_year' => $schoolYear ?: $subject->school_year,
                'section_name' => 'Unassigned Section',
                'students' => array_values($students),
            ];
        }

        // Terms this instructor actually has grades for, newest first
        $availableTerms = Grade::where('instructor_id', $instructor->id)
            ->whereNotNull('school_year')
            ->select('school_year', 'semester')
            ->distinct()
            ->get()
            ->map(fn ($g) => ['school_year' => $g->school_year, 'semester' => $g->semester])
            ->sortByDesc(fn ($t) => $t['school_year'] . '|' . $t['semester'])
            ->values();

        return response()->json([
            'success' => true,
            'data' => $rosterData,
            'available_terms' => $availableTerms,
        ]);
    }
}