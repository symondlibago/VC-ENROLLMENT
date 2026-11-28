<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Subjects a student is taking that no section of theirs teaches.
 *
 * An irregular student carries back subjects: a second year might sit three
 * second-year subjects with their own section and two first-year subjects
 * with a different section under a different instructor. Enrolling them in
 * the subject is one step; putting them in the section that teaches it is
 * another, and the second one gets forgotten. The student then sits in a
 * class whose section list does not have them on it.
 *
 * What counts as a gap is narrow on purpose. A subject taught in five
 * sections of the same course would otherwise flag the student as missing
 * from four of them, which is noise — on this database the loose reading
 * gives 1,401 pairs against 238 real ones. A gap is only a gap when NONE of
 * the sections the student already belongs to teaches the subject.
 *
 * Which section they then belong in is the registrar's call, not a guess the
 * system should make: the same subject is often taught by several sections
 * and nothing in the data says which one the student actually attends. So
 * this lists the candidates, puts the likeliest first, and lets a person
 * choose — except where there is exactly one, which can be done in a click.
 */
class SectionGapController extends Controller
{
    /** Students enrolled and not withdrawn — the only ones worth flagging. */
    private const ACTIVE = 'p.enrollment_status = "enrolled" AND p.academic_status <> "Withdraw"';

    /**
     * Every gap, with the sections that could close it.
     *
     * Three queries whatever the size of the school: the gaps, the candidate
     * sections for the subjects involved, and the sections each student is
     * already in. Everything else is assembled in memory.
     */
    public function index(): JsonResponse
    {
        $gaps = DB::select('
            SELECT
                ss.pre_enrolled_student_id AS student_id,
                ss.subject_id,
                p.student_id_number,
                p.last_name, p.first_name, p.middle_name,
                p.year AS student_year,
                p.course_id,
                c.course_code,
                sub.subject_code,
                sub.descriptive_title,
                sub.year AS subject_year,
                sub.semester AS subject_semester
            FROM student_subject ss
            JOIN pre_enrolled_students p ON p.id = ss.pre_enrolled_student_id
            JOIN subjects sub ON sub.id = ss.subject_id
            LEFT JOIN courses c ON c.id = p.course_id
            WHERE ' . self::ACTIVE . '
              -- Only subjects that are actually timetabled somewhere
              AND EXISTS (SELECT 1 FROM schedules sc WHERE sc.subject_id = ss.subject_id)
              -- and that none of the student\'s own sections teaches
              AND NOT EXISTS (
                  SELECT 1
                  FROM schedules sc
                  JOIN section_student sst ON sst.section_id = sc.section_id
                  WHERE sc.subject_id = ss.subject_id
                    AND sst.pre_enrolled_student_id = ss.pre_enrolled_student_id
              )
            ORDER BY p.last_name, p.first_name, sub.subject_code
        ');

        if (empty($gaps)) {
            return response()->json(['success' => true, 'data' => [], 'total_gaps' => 0]);
        }

        $subjectIds = array_values(array_unique(array_column($gaps, 'subject_id')));

        // The sections that teach each of those subjects, with who takes it
        // and when, so the registrar is choosing between real timetable rows.
        $candidates = DB::table('schedules as sc')
            ->join('sections as sec', 'sec.id', '=', 'sc.section_id')
            ->leftJoin('instructors as i', 'i.id', '=', 'sc.instructor_id')
            ->whereIn('sc.subject_id', $subjectIds)
            ->groupBy('sc.subject_id', 'sc.section_id', 'sec.name', 'sec.course_id', 'i.name')
            ->select([
                'sc.subject_id',
                'sc.section_id',
                'sec.name as section_name',
                'sec.course_id as section_course_id',
                'i.name as instructor',
                DB::raw("GROUP_CONCAT(DISTINCT CONCAT(sc.day, ' ', sc.time) ORDER BY sc.day SEPARATOR ' / ') as meets"),
            ])
            ->get();

        $bySubject = [];
        foreach ($candidates as $row) {
            $bySubject[$row->subject_id][] = $row;
        }

        $out = [];
        foreach ($gaps as $gap) {
            $options = $bySubject[$gap->subject_id] ?? [];

            // A section of the student's own course first — that is nearly
            // always the right one, and it is the only ordering the data
            // actually supports.
            usort($options, function ($a, $b) use ($gap) {
                $sameA = (int) ($a->section_course_id == $gap->course_id);
                $sameB = (int) ($b->section_course_id == $gap->course_id);
                return $sameB <=> $sameA ?: strcmp($a->section_name, $b->section_name);
            });

            $key = $gap->student_id;
            if (!isset($out[$key])) {
                $out[$key] = [
                    'student_id' => $gap->student_id,
                    'student_id_number' => $gap->student_id_number,
                    'name' => trim(sprintf(
                        '%s, %s %s',
                        $gap->last_name,
                        $gap->first_name,
                        $gap->middle_name ? strtoupper(substr($gap->middle_name, 0, 1)) . '.' : ''
                    )),
                    'year' => $gap->student_year,
                    'course_code' => $gap->course_code,
                    'subjects' => [],
                ];
            }

            $out[$key]['subjects'][] = [
                'subject_id' => $gap->subject_id,
                'subject_code' => $gap->subject_code,
                'descriptive_title' => $gap->descriptive_title,
                'subject_year' => $gap->subject_year,
                'subject_semester' => $gap->subject_semester,
                'sections' => array_map(static fn ($o) => [
                    'section_id' => $o->section_id,
                    'name' => $o->section_name,
                    'instructor' => $o->instructor,
                    'meets' => $o->meets,
                    'same_course' => (bool) ($o->section_course_id == $gap->course_id),
                ], $options),
            ];
        }

        $list = array_values($out);

        return response()->json([
            'success' => true,
            'data' => $list,
            'total_gaps' => count($gaps),
            'students_affected' => count($list),
            // The ones a person does not need to decide on
            'single_option' => count(array_filter(
                $gaps,
                fn ($g) => count($bySubject[$g->subject_id] ?? []) === 1
            )),
        ]);
    }

    /**
     * Put students into sections.
     *
     * Takes a list so a whole screen of fixes is one request, and uses
     * firstOrCreate semantics per pair so pressing the button twice cannot
     * duplicate a membership.
     */
    public function assign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => ['required', 'array', 'min:1', 'max:200'],
            'assignments.*.pre_enrolled_student_id' => ['required', 'integer', 'exists:pre_enrolled_students,id'],
            'assignments.*.section_id' => ['required', 'integer', 'exists:sections,id'],
        ]);

        $now = now();
        $added = 0;

        try {
            DB::transaction(function () use ($validated, $now, &$added) {
                foreach ($validated['assignments'] as $pair) {
                    $exists = DB::table('section_student')
                        ->where('pre_enrolled_student_id', $pair['pre_enrolled_student_id'])
                        ->where('section_id', $pair['section_id'])
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    DB::table('section_student')->insert([
                        'pre_enrolled_student_id' => $pair['pre_enrolled_student_id'],
                        'section_id' => $pair['section_id'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $added += 1;
                }
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not assign. Nothing was changed.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => $added === 0
                ? 'Those students were already in those sections.'
                : $added . ' ' . ($added === 1 ? 'student was' : 'students were') . ' added to a section.',
            'added' => $added,
        ]);
    }
}
