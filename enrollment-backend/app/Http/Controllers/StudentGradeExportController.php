<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\PreEnrolledStudent;
use App\Support\GradeEquivalent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Grades for a hand-picked set of students, flattened one row per subject.
 *
 * The registrar ticks students on the Students page — scholars, usually — and
 * exports their record for whoever is asking for it. Nothing is stored; the
 * sheet is built in the browser from these rows.
 */
class StudentGradeExportController extends Controller
{
    private const DESK_ROLES = ['Admin', 'Registrar', 'Program Head', 'Cashier'];

    /** Earlier terms first; a summer term closes out its school year. */
    private const SEMESTER_ORDER = ['1st Semester' => 1, '2nd Semester' => 2, 'Summer' => 3];

    public function __invoke(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'student_ids' => 'required|array|min:1|max:2000',
            'student_ids.*' => 'integer',
            'school_year' => 'nullable|string|max:50',
            'semester' => 'nullable|string|max:50',
        ]);

        $students = PreEnrolledStudent::whereIn('id', $validated['student_ids'])
            ->get(['id', 'school_year', 'semester']);

        if ($students->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $grades = Grade::query()
            ->with([
                'subject:id,subject_code,descriptive_title,total_units',
                'student:id,student_id_number,last_name,first_name,middle_name,year',
            ])
            ->whereIn('pre_enrolled_student_id', $students->pluck('id'))
            ->tap(fn ($query) => $this->limitToTerm($query, $students, $validated))
            ->get()
            ->filter(fn (Grade $grade) => $grade->subject && $grade->student);

        $rows = $grades
            ->map(fn (Grade $grade) => $this->row($grade))
            ->sort(function ($a, $b) {
                return [$a['name'], $a['school_year'], self::SEMESTER_ORDER[$a['semester']] ?? 9, $a['subject_code']]
                    <=> [$b['name'], $b['school_year'], self::SEMESTER_ORDER[$b['semester']] ?? 9, $b['subject_code']];
            })
            ->values();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Narrows the grades to one term.
     *
     * By default that is whatever term each student is enrolled in right now,
     * which differs between students, so the terms are grouped and matched
     * together. An explicit school year and semester overrides it for everyone.
     */
    private function limitToTerm($query, $students, array $validated): void
    {
        $year = $validated['school_year'] ?? null;
        $semester = $validated['semester'] ?? null;

        if ($year || $semester) {
            if ($year) {
                $query->where('school_year', $year);
            }
            if ($semester) {
                $query->where('semester', $semester);
            }

            return;
        }

        $byTerm = $students->groupBy(fn ($student) => "{$student->school_year}|{$student->semester}");

        $query->where(function ($outer) use ($byTerm) {
            foreach ($byTerm as $term => $group) {
                [$termYear, $termSemester] = explode('|', $term, 2);
                // A student with no term on file has nothing current to export.
                if ($termYear === '' || $termSemester === '') {
                    continue;
                }
                $outer->orWhere(function ($inner) use ($group, $termYear, $termSemester) {
                    $inner->whereIn('pre_enrolled_student_id', $group->pluck('id'))
                        ->where('school_year', $termYear)
                        ->where('semester', $termSemester);
                });
            }
            // Nothing matched: make sure the query returns no rows rather than all.
            $outer->orWhereRaw('1 = 0');
        });
    }

    private function row(Grade $grade): array
    {
        // The overall final grade — the mean of every period the class is
        // marked on — not the final period alone, and blank until they are all
        // in. This is the figure the grading sheet and the transcript print.
        $mark = $grade->computedFinalGrade();

        return [
            'school_year' => (string) $grade->school_year,
            'semester' => (string) $grade->semester,
            'year_level' => (string) ($grade->year ?: $grade->student->year),
            'student_id_number' => (string) $grade->student->student_id_number,
            'name' => $grade->student->full_name,
            'subject_code' => (string) $grade->subject->subject_code,
            'subject_name' => (string) $grade->subject->descriptive_title,
            'units' => $grade->subject->total_units !== null ? (float) $grade->subject->total_units : '',
            // Reported on the 1.0–5.0 scale, the way every official document
            // states a final grade — never the raw percentage.
            'final_grade' => GradeEquivalent::for($mark),
            'status' => (string) $grade->status,
        ];
    }
}
