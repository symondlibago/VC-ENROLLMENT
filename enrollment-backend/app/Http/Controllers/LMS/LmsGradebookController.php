<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsAssignment;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LmsGradebookController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    /**
     * GET /me/gradebook
     * Student-only view of every assignment they have visibility into,
     * grouped by subject, with submission status + grade.
     */
    public function myGradebook(Request $request)
    {
        if ($this->role($request) !== 'student') abort(403, 'Students only.');

        $user = $request->user();

        // Subjects student is enrolled in
        $subjectIds = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $user->id)
            ->pluck('student_subject.subject_id')
            ->unique()
            ->values()
            ->all();

        if (empty($subjectIds)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'subjects' => [],
                    'totals' => [
                        'assignments' => 0,
                        'submitted' => 0,
                        'graded' => 0,
                        'missing' => 0,
                        'average_percent' => null,
                    ],
                ],
            ]);
        }

        $studentSectionIds = DB::table('section_student')
            ->join('pre_enrolled_students', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $user->id)
            ->pluck('section_student.section_id')
            ->all();

        // Assignments scoped via modules that belong to the subjects above and
        // are either section-less or scoped to a section the student is in.
        $assignments = LmsAssignment::with(['module:id,subject_id,section_id,title', 'module.subject:id,subject_code,descriptive_title'])
            ->whereHas('module', function ($q) use ($subjectIds, $studentSectionIds) {
                $q->whereIn('subject_id', $subjectIds)
                  ->where(function ($qq) use ($studentSectionIds) {
                      $qq->whereNull('section_id');
                      if (!empty($studentSectionIds)) {
                          $qq->orWhereIn('section_id', $studentSectionIds);
                      }
                  });
            })
            ->orderByDesc('due_at')
            ->get();

        $assignmentIds = $assignments->pluck('id')->all();
        $mySubmissions = LmsSubmission::where('student_user_id', $user->id)
            ->whereIn('assignment_id', $assignmentIds)
            ->get()
            ->keyBy('assignment_id');

        $subjectsBucket = [];
        $totals = ['assignments' => 0, 'submitted' => 0, 'graded' => 0, 'missing' => 0];
        $weightedScore = 0.0;
        $weightedMax = 0.0;

        foreach ($assignments as $a) {
            $sub = $mySubmissions->get($a->id);
            $totals['assignments']++;
            if ($sub) {
                $totals['submitted']++;
                if (!is_null($sub->score)) {
                    $totals['graded']++;
                    $weightedScore += (float) $sub->score;
                    $weightedMax += (float) ($a->max_score ?: 100);
                }
            } else {
                $totals['missing']++;
            }

            $status = !$sub
                ? ($a->due_at && now()->gt($a->due_at) ? 'missing' : 'pending')
                : (is_null($sub->score) ? 'submitted' : 'graded');

            $sid = (int) $a->module->subject_id;
            if (!isset($subjectsBucket[$sid])) {
                $subjectsBucket[$sid] = [
                    'id' => $sid,
                    'subject_code' => $a->module->subject->subject_code ?? null,
                    'descriptive_title' => $a->module->subject->descriptive_title ?? null,
                    'assignments' => [],
                    'stats' => ['assignments' => 0, 'submitted' => 0, 'graded' => 0, 'missing' => 0, 'earned' => 0.0, 'possible' => 0.0],
                ];
            }
            $subjectsBucket[$sid]['assignments'][] = [
                'id' => $a->id,
                'module_id' => $a->module_id,
                'module_title' => $a->module->title ?? null,
                'title' => $a->title,
                'due_at' => $a->due_at,
                'max_score' => $a->max_score,
                'status' => $status,
                'submission' => $sub ? [
                    'id' => $sub->id,
                    'submitted_at' => $sub->submitted_at,
                    'original_name' => $sub->original_name,
                    'score' => $sub->score,
                    'feedback' => $sub->feedback,
                    'graded_at' => $sub->graded_at,
                ] : null,
            ];

            $subjectsBucket[$sid]['stats']['assignments']++;
            if ($sub) {
                $subjectsBucket[$sid]['stats']['submitted']++;
                if (!is_null($sub->score)) {
                    $subjectsBucket[$sid]['stats']['graded']++;
                    $subjectsBucket[$sid]['stats']['earned'] += (float) $sub->score;
                    $subjectsBucket[$sid]['stats']['possible'] += (float) ($a->max_score ?: 100);
                }
            } else {
                $subjectsBucket[$sid]['stats']['missing']++;
            }
        }

        foreach ($subjectsBucket as &$sb) {
            $sb['stats']['average_percent'] = $sb['stats']['possible'] > 0
                ? round(($sb['stats']['earned'] / $sb['stats']['possible']) * 100, 1)
                : null;
        }
        unset($sb);

        $totals['average_percent'] = $weightedMax > 0
            ? round(($weightedScore / $weightedMax) * 100, 1)
            : null;

        return response()->json([
            'success' => true,
            'data' => [
                'subjects' => array_values($subjectsBucket),
                'totals' => $totals,
            ],
        ]);
    }

    /**
     * GET /assignments/{assignmentId}/roster
     * Instructor / admin view that lists every enrolled student for the
     * assignment's subject (scoped to the module's section if any), with
     * their submission status.
     */
    public function roster(Request $request, int $assignmentId)
    {
        $role = $this->role($request);
        if ($role !== 'admin' && $role !== 'instructor') abort(403);

        $assignment = LmsAssignment::with('module')->findOrFail($assignmentId);
        $subjectId = (int) $assignment->module->subject_id;

        if ($role === 'instructor' && !LmsInstructorScope::teaches($request->user()->id, $subjectId)) {
            abort(403, 'You are not assigned to this subject.');
        }

        $sectionId = $assignment->module->section_id ? (int) $assignment->module->section_id : null;

        // Enrolled students (optionally narrowed to the module's section)
        $studentsQ = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->join('users', 'users.id', '=', 'pre_enrolled_students.user_id')
            ->where('student_subject.subject_id', $subjectId)
            ->whereNotNull('pre_enrolled_students.user_id')
            ->select(
                'users.id as user_id',
                'users.name',
                'users.email',
                'pre_enrolled_students.id as pre_enrolled_id'
            );

        if (!is_null($sectionId)) {
            $studentsQ->join('section_student', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('section_student.section_id', $sectionId);
        }

        $students = $studentsQ->orderBy('users.name')->get()->unique('user_id')->values();

        $userIds = $students->pluck('user_id')->all();
        $submissions = LmsSubmission::where('assignment_id', $assignmentId)
            ->whereIn('student_user_id', $userIds)
            ->with('grader:id,name')
            ->orderByDesc('submitted_at')
            ->get()
            ->groupBy('student_user_id')
            ->map(fn($g) => $g->first()); // latest

        $rows = [];
        $stats = ['total' => 0, 'submitted' => 0, 'graded' => 0, 'missing' => 0, 'late' => 0];

        $now = now();
        foreach ($students as $s) {
            $stats['total']++;
            $sub = $submissions->get((int) $s->user_id);

            $isLate = false;
            $daysLate = 0;
            $status = 'not_submitted';
            if ($sub) {
                $stats['submitted']++;
                if (!is_null($sub->score)) {
                    $status = 'graded';
                    $stats['graded']++;
                } else {
                    $status = 'submitted';
                }
                $late = LmsSubmission::computeLate($assignment->due_at, $sub->submitted_at);
                if ($late['is_late']) {
                    $isLate = true;
                    $daysLate = $late['days_late'];
                    $stats['late']++;
                }
            } else {
                $stats['missing']++;
            }

            $rows[] = [
                'user_id' => (int) $s->user_id,
                'name' => $s->name,
                'email' => $s->email,
                'status' => $status,
                'is_late' => $isLate,
                'days_late' => $daysLate,
                'submission' => $sub ? [
                    'id' => $sub->id,
                    'original_name' => $sub->original_name,
                    'submitted_at' => $sub->submitted_at,
                    'score' => $sub->score,
                    'feedback' => $sub->feedback,
                    'graded_at' => $sub->graded_at,
                    'grader' => $sub->grader ? ['id' => $sub->grader->id, 'name' => $sub->grader->name] : null,
                ] : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'assignment' => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'max_score' => $assignment->max_score,
                    'due_at' => $assignment->due_at,
                    'allow_late' => (bool) $assignment->allow_late,
                ],
                'stats' => $stats,
                'rows' => $rows,
            ],
        ]);
    }
}
