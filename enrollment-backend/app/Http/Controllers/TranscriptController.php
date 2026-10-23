<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\PreEnrolledStudent;
use App\Support\GradeEquivalent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Builds the dataset behind an Official Transcript of Records (VIPC-RO-07).
 *
 * Nothing here is stored: the registrar pulls a student's record, edits
 * whatever needs correcting on screen and the document is generated in the
 * browser. Alumni from before the system simply skip this endpoint and type
 * every field by hand.
 */
class TranscriptController extends Controller
{
    /** Only the desks that sign and issue the transcript may pull a record. */
    private const DESK_ROLES = ['Admin', 'Registrar'];

    /** The school's own name, as it is underlined on the collegiate record. */
    public const HOME_SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE – Cagayan de Oro City';

    /** Grade statuses that print as a remark instead of a numeric equivalent. */
    private const REMARK_STATUSES = ['INC', 'NFE', 'NFR', 'DA', 'Credited'];

    /** Earlier semesters first; a summer term closes out its school year. */
    private const SEMESTER_ORDER = ['1st Semester' => 1, '2nd Semester' => 2, 'Summer' => 3];

    /** The preliminary-education rows, in the order they print. */
    private const PRELIMINARY_ROWS = [
        ['ELEMENTARY EDUCATION', 'elementary', 'elementary_date_completed'],
        ['JUNIOR HIGH SCHOOL', 'junior_high_school', 'junior_high_date_completed'],
        ['SENIOR HIGH SCHOOL', 'senior_high_school', 'senior_high_date_completed'],
        ['SECONDARY EDUCATION', 'high_school_non_k12', 'high_school_non_k12_date_completed'],
        ['COLLEGE', 'college', 'college_date_completed'],
    ];

    public function show(PreEnrolledStudent $preEnrolledStudent): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $student = $preEnrolledStudent->load('course:id,course_code,course_name,course_specialization');

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $this->bio($student),
                'preliminary' => $this->preliminary($student),
                'sections' => $this->collegiateRecord($student),
            ],
        ]);
    }

    // ───────────────────────────── sections ─────────────────────────────

    private function bio(PreEnrolledStudent $student): array
    {
        return [
            'pre_enrolled_student_id' => $student->id,
            'name' => $student->full_name,
            'student_id_number' => (string) $student->student_id_number,
            'address' => (string) $student->address,
            'gender' => (string) $student->gender,
            'civil_status' => (string) $student->civil_status,
            'birth_date' => $this->longDate($student->birth_date),
            'birth_place' => (string) $student->birth_place,
            // No column records admission; the first enrolment month is the
            // closest honest answer, and the registrar can correct it.
            'date_of_admission' => $student->created_at?->format('F, Y') ?? '',
            // Not captured anywhere yet — always typed in by the registrar.
            'admission_credential' => '',
            'candidate_for_title' => $this->programTitle($student),
            'major' => (string) ($student->course->course_specialization ?? ''),
            'date_of_graduation' => '',
        ];
    }

    /** Schools attended before college, skipping the ones left blank. */
    private function preliminary(PreEnrolledStudent $student): array
    {
        $rows = [];
        foreach (self::PRELIMINARY_ROWS as [$label, $schoolField, $dateField]) {
            $school = trim((string) $student->{$schoolField});
            if ($school === '') {
                continue;
            }
            $rows[] = [
                'label' => $label,
                'school' => $school,
                // The enrolment form never asks where the school is.
                'address' => '',
                'year_completed' => trim((string) $student->{$dateField}),
            ];
        }

        return $rows;
    }

    /**
     * Every graded subject, grouped school → program → term in the order the
     * transcript prints them. One query, grouped in memory.
     */
    private function collegiateRecord(PreEnrolledStudent $student): array
    {
        $grades = Grade::with([
                'subject:id,subject_code,descriptive_title,total_units',
                // passingMark() falls back to the student's year level when a
                // grade row has none; loading it here keeps that off the N+1 path.
                'student:id,year',
            ])
            ->where('pre_enrolled_student_id', $student->id)
            // Subjects are entered in curriculum order, which is the order the
            // transcript lists them in; nothing else records a sequence.
            ->orderBy('subject_id')
            ->get()
            ->filter(fn (Grade $grade) => $grade->subject !== null);

        if ($grades->isEmpty()) {
            return [];
        }

        $terms = [];
        foreach ($grades as $grade) {
            $key = $this->termKey($grade);
            $terms[$key]['label'] ??= $this->termLabel($grade);
            $terms[$key]['sort'] ??= $key;
            $terms[$key]['rows'][] = $this->row($grade);
        }

        ksort($terms);

        foreach ($terms as &$term) {
            unset($term['sort']);
        }
        unset($term);

        // Everything the system knows about was earned here, so it is one
        // block; transfers from other schools are added on screen.
        return [[
            'school' => self::HOME_SCHOOL,
            'program' => $this->programTitle($student),
            'major' => (string) ($student->course->course_specialization ?? ''),
            'terms' => array_values($terms),
        ]];
    }

    private function row(Grade $grade): array
    {
        $units = (float) ($grade->subject->total_units ?? 0);
        $mark = $grade->passingMark();
        $failed = in_array($grade->status, ['Failed', 'NFE', 'NFR', 'DA'], true)
            || ($mark !== null && $mark < 75);

        return [
            'code' => (string) $grade->subject->subject_code,
            'title' => (string) $grade->subject->descriptive_title,
            'grade' => $this->displayGrade($grade, $mark),
            'reexam' => '',
            // A failed subject earns nothing, however many units it carried.
            'credits' => $failed ? '0.0' : $this->units($units),
        ];
    }

    /** The 1.0–5.0 equivalent, or the remark that stands in its place. */
    private function displayGrade(Grade $grade, ?float $mark): string
    {
        if (in_array($grade->status, self::REMARK_STATUSES, true)) {
            return $grade->status;
        }
        if ($mark === null) {
            return '';
        }

        return self::equivalent($mark);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    /** Sorts as school year then semester, e.g. "2024-2025|1". */
    private function termKey(Grade $grade): string
    {
        $semester = $this->isSummer($grade) ? 'Summer' : (string) $grade->semester;

        return sprintf('%s|%d', (string) $grade->school_year, self::SEMESTER_ORDER[$semester] ?? 9);
    }

    private function termLabel(Grade $grade): string
    {
        $year = $grade->school_year ? ", SY {$grade->school_year}" : '';
        if ($this->isSummer($grade)) {
            return "Summer{$year}";
        }

        $names = ['1st Semester' => 'First Semester', '2nd Semester' => 'Second Semester'];

        return ($names[$grade->semester] ?? (string) $grade->semester) . $year;
    }

    private function isSummer(Grade $grade): bool
    {
        return str_contains((string) $grade->year, 'Summer')
            || str_contains((string) $grade->semester, 'Summer');
    }

    private function programTitle(PreEnrolledStudent $student): string
    {
        return (string) ($student->course->course_name ?? '');
    }

    /** "3" stays "3"; "1.5" keeps its decimal. */
    private function units(float $units): string
    {
        if ($units <= 0) {
            return '';
        }

        return fmod($units, 1.0) === 0.0 ? (string) (int) $units : rtrim(rtrim(number_format($units, 2, '.', ''), '0'), '.');
    }

    private function longDate($value): string
    {
        if (!$value) {
            return '';
        }

        try {
            return \Carbon\Carbon::parse($value)->format('F j, Y');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    /** Percentage → the 1.0–5.0 equivalent printed on official documents. */
    public static function equivalent(float $percentage): string
    {
        return GradeEquivalent::for($percentage);
    }
}
