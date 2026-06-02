<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsAssignment;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LmsCalendarController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    public function index(Request $request)
    {
        $role = $this->role($request);
        $user = $request->user();

        [$from, $to] = $this->parseRange($request);

        if ($role === 'student') {
            return $this->studentEvents((int) $user->id, $from, $to);
        }
        if ($role === 'instructor') {
            return $this->scopedEvents(LmsInstructorScope::subjectIdsFor((int) $user->id)->all(), $from, $to);
        }
        if ($role === 'admin') {
            return $this->scopedEvents(null, $from, $to); // null = all subjects
        }
        abort(403);
    }

    /**
     * Parse optional from/to query params into day-bounded Carbon instances.
     */
    private function parseRange(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        try {
            $from = $from ? Carbon::parse($from)->startOfDay() : null;
        } catch (\Throwable $e) {
            $from = null;
        }
        try {
            $to = $to ? Carbon::parse($to)->endOfDay() : null;
        } catch (\Throwable $e) {
            $to = null;
        }

        return [$from, $to];
    }

    /**
     * Limit a query to assignments that have a due date within the window.
     */
    private function applyWindow($query, $from, $to)
    {
        $query->whereNotNull('due_at');
        if ($from) {
            $query->where('due_at', '>=', $from);
        }
        if ($to) {
            $query->where('due_at', '<=', $to);
        }
        return $query;
    }

    /**
     * Student view: deadlines for enrolled subjects, scoped to section-less or
     * the student's own section, plus that student's submission status.
     */
    private function studentEvents(int $userId, $from, $to)
    {
        $subjectIds = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $userId)
            ->pluck('student_subject.subject_id')
            ->unique()
            ->values()
            ->all();

        if (empty($subjectIds)) {
            return response()->json(['success' => true, 'data' => ['events' => []]]);
        }

        $studentSectionIds = DB::table('section_student')
            ->join('pre_enrolled_students', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $userId)
            ->pluck('section_student.section_id')
            ->all();

        $query = LmsAssignment::with([
            'module:id,subject_id,section_id,title',
            'module.subject:id,subject_code,descriptive_title',
        ])->whereHas('module', function ($q) use ($subjectIds, $studentSectionIds) {
            $q->whereIn('subject_id', $subjectIds)
              ->where(function ($qq) use ($studentSectionIds) {
                  $qq->whereNull('section_id');
                  if (!empty($studentSectionIds)) {
                      $qq->orWhereIn('section_id', $studentSectionIds);
                  }
              });
        });

        $this->applyWindow($query, $from, $to);
        $assignments = $query->orderBy('due_at')->get();

        $submissions = LmsSubmission::where('student_user_id', $userId)
            ->whereIn('assignment_id', $assignments->pluck('id')->all())
            ->get()
            ->keyBy('assignment_id');

        $events = $assignments->map(function ($a) use ($submissions) {
            $sub = $submissions->get($a->id);
            $status = !$sub
                ? ($a->due_at && now()->gt($a->due_at) ? 'missing' : 'pending')
                : (is_null($sub->score) ? 'submitted' : 'graded');

            return $this->formatEvent($a, $status);
        })->values();

        return response()->json(['success' => true, 'data' => ['events' => $events]]);
    }

    /**
     * Instructor / admin view: deadlines for the given subject ids
     * (null = every subject, used by admin). No per-student status.
     */
    private function scopedEvents(?array $subjectIds, $from, $to)
    {
        $query = LmsAssignment::with([
            'module:id,subject_id,section_id,title',
            'module.subject:id,subject_code,descriptive_title',
        ]);

        if (is_array($subjectIds)) {
            if (empty($subjectIds)) {
                return response()->json(['success' => true, 'data' => ['events' => []]]);
            }
            $query->whereHas('module', fn($q) => $q->whereIn('subject_id', $subjectIds));
        }

        $this->applyWindow($query, $from, $to);
        $assignments = $query->orderBy('due_at')->get();

        $events = $assignments->map(fn($a) => $this->formatEvent($a, null))->values();

        return response()->json(['success' => true, 'data' => ['events' => $events]]);
    }

    /**
     * Shape a single assignment into a calendar event payload.
     */
    private function formatEvent(LmsAssignment $a, ?string $status): array
    {
        return [
            'id' => 'assignment-' . $a->id,
            'type' => 'assignment_due',
            'assignment_id' => $a->id,
            'title' => $a->title,
            'due_at' => $a->due_at,
            'allow_late' => (bool) $a->allow_late,
            'subject_id' => $a->module->subject_id ?? null,
            'subject_code' => $a->module->subject->subject_code ?? null,
            'descriptive_title' => $a->module->subject->descriptive_title ?? null,
            'module_title' => $a->module->title ?? null,
            'status' => $status, // null for instructor/admin
        ];
    }
}
