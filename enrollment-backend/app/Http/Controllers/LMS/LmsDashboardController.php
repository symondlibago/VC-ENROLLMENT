<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsAssignment;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsModule;
use App\Models\LMS\LmsSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LmsDashboardController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    /**
     * GET /me/dashboard
     * Returns role-tailored stats + a small "upcoming" feed.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $this->role($request);

        if ($role === 'student') {
            return $this->studentDashboard($user->id);
        }
        if ($role === 'instructor') {
            return $this->instructorDashboard($user->id);
        }
        if ($role === 'admin') {
            return $this->adminDashboard();
        }
        abort(403);
    }

    private function studentDashboard(int $userId)
    {
        $subjectIds = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $userId)
            ->pluck('student_subject.subject_id')
            ->unique()
            ->values()
            ->all();

        $studentSectionIds = DB::table('section_student')
            ->join('pre_enrolled_students', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $userId)
            ->pluck('section_student.section_id')
            ->all();

        $assignmentsQ = LmsAssignment::with(['module:id,subject_id,section_id,title', 'module.subject:id,subject_code'])
            ->whereHas('module', function ($q) use ($subjectIds, $studentSectionIds) {
                $q->whereIn('subject_id', $subjectIds)
                  ->where(function ($qq) use ($studentSectionIds) {
                      $qq->whereNull('section_id');
                      if (!empty($studentSectionIds)) {
                          $qq->orWhereIn('section_id', $studentSectionIds);
                      }
                  });
            });

        $totalAssignments = (clone $assignmentsQ)->count();

        $mySubmissions = LmsSubmission::where('student_user_id', $userId)->get();
        $submittedCount = $mySubmissions->count();
        $gradedCount = $mySubmissions->whereNotNull('score')->count();

        // Upcoming: due in the future, not yet submitted, scoped to my view.
        $upcoming = (clone $assignmentsQ)
            ->whereNotNull('due_at')
            ->where('due_at', '>=', now())
            ->orderBy('due_at')
            ->limit(5)
            ->get()
            ->map(function ($a) use ($userId) {
                $has = LmsSubmission::where('assignment_id', $a->id)
                    ->where('student_user_id', $userId)
                    ->exists();
                return [
                    'id' => $a->id,
                    'title' => $a->title,
                    'due_at' => $a->due_at,
                    'subject_code' => $a->module->subject->subject_code ?? null,
                    'subject_id' => $a->module->subject_id,
                    'module_title' => $a->module->title ?? null,
                    'submitted' => $has,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'role' => 'student',
                'stats' => [
                    'subjects' => count($subjectIds),
                    'assignments' => $totalAssignments,
                    'submitted' => $submittedCount,
                    'graded' => $gradedCount,
                    'pending' => max(0, $totalAssignments - $submittedCount),
                ],
                'upcoming' => $upcoming,
            ],
        ]);
    }

    private function instructorDashboard(int $userId)
    {
        $subjectIds = LmsInstructorScope::subjectIdsFor($userId);
        $moduleCount = LmsModule::whereIn('subject_id', $subjectIds)->count();

        $assignmentIds = LmsAssignment::whereHas('module', function ($q) use ($subjectIds) {
            $q->whereIn('subject_id', $subjectIds);
        })->pluck('id');

        $submissionsQ = LmsSubmission::whereIn('assignment_id', $assignmentIds);
        $totalSubmissions = (clone $submissionsQ)->count();
        $ungraded = (clone $submissionsQ)->whereNull('score')->count();

        // Recent submissions to review
        $recent = LmsSubmission::with(['student:id,name', 'assignment:id,title,module_id', 'assignment.module:id,title,subject_id', 'assignment.module.subject:id,subject_code'])
            ->whereIn('assignment_id', $assignmentIds)
            ->whereNull('score')
            ->orderByDesc('submitted_at')
            ->limit(6)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'student' => $s->student ? ['id' => $s->student->id, 'name' => $s->student->name] : null,
                    'assignment_title' => $s->assignment->title ?? null,
                    'assignment_id' => $s->assignment_id,
                    'module_title' => $s->assignment->module->title ?? null,
                    'subject_code' => $s->assignment->module->subject->subject_code ?? null,
                    'subject_id' => $s->assignment->module->subject_id ?? null,
                    'submitted_at' => $s->submitted_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'role' => 'instructor',
                'stats' => [
                    'subjects' => count($subjectIds),
                    'modules' => $moduleCount,
                    'submissions' => $totalSubmissions,
                    'ungraded' => $ungraded,
                ],
                'recent_submissions' => $recent,
            ],
        ]);
    }

    private function adminDashboard()
    {
        $subjects = DB::table('subjects')->count();
        $instructors = DB::table('users')->whereRaw('LOWER(role) = ?', ['instructor'])->count();
        $modules = LmsModule::count();
        $assignments = LmsAssignment::count();
        $submissions = LmsSubmission::count();
        $ungraded = LmsSubmission::whereNull('score')->count();

        $recent = LmsSubmission::with(['student:id,name', 'assignment:id,title,module_id', 'assignment.module:id,title,subject_id', 'assignment.module.subject:id,subject_code'])
            ->whereNull('score')
            ->orderByDesc('submitted_at')
            ->limit(6)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'student' => $s->student ? ['id' => $s->student->id, 'name' => $s->student->name] : null,
                    'assignment_title' => $s->assignment->title ?? null,
                    'assignment_id' => $s->assignment_id,
                    'module_title' => $s->assignment->module->title ?? null,
                    'subject_code' => $s->assignment->module->subject->subject_code ?? null,
                    'subject_id' => $s->assignment->module->subject_id ?? null,
                    'submitted_at' => $s->submitted_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'role' => 'admin',
                'stats' => [
                    'subjects' => $subjects,
                    'instructors' => $instructors,
                    'modules' => $modules,
                    'assignments' => $assignments,
                    'submissions' => $submissions,
                    'ungraded' => $ungraded,
                ],
                'recent_submissions' => $recent,
            ],
        ]);
    }
}
