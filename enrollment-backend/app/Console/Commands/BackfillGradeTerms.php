<?php

namespace App\Console\Commands;

use App\Models\EnrollmentHistory;
use App\Models\Grade;
use App\Models\PreEnrolledStudent;
use App\Models\Schedule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fills in the term and section on grade rows created before those columns
 * existed, so past students still appear in their instructor's roster.
 *
 * Section is only written when it can be established beyond doubt:
 *   1. the student is still in a section the instructor teaches this subject to, or
 *   2. the instructor only ever taught one section of the subject.
 * Anything ambiguous is left null rather than guessed.
 *
 * Term comes from the student's current record while they are still linked to
 * the subject, otherwise from the archived enrollment history that lists it.
 */
class BackfillGradeTerms extends Command
{
    protected $signature = 'grades:backfill-terms {--dry-run : Report what would change without writing}';

    protected $description = 'Backfill school_year, semester, year and section_id on existing grade records';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $grades = Grade::whereNull('school_year')->orWhereNull('section_id')->get();
        $this->info("Examining {$grades->count()} grade records…");

        $students = PreEnrolledStudent::all(['id', 'school_year', 'semester', 'year'])->keyBy('id');

        // Sections each instructor is scheduled to teach a subject to
        $scheduleSections = Schedule::whereNotNull('section_id')
            ->get(['subject_id', 'instructor_id', 'section_id'])
            ->groupBy(fn ($s) => "{$s->subject_id}|{$s->instructor_id}")
            ->map(fn ($group) => $group->pluck('section_id')->unique()->values());

        // Sections each student currently belongs to
        $studentSections = DB::table('section_student')
            ->get(['pre_enrolled_student_id', 'section_id'])
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($rows) => $rows->pluck('section_id')->all());

        // Subjects each student is still linked to
        $studentSubjects = DB::table('student_subject')
            ->get(['pre_enrolled_student_id', 'subject_id'])
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($rows) => $rows->pluck('subject_id')->all());

        // Archived terms, with the subject codes taken in each
        $histories = EnrollmentHistory::all()
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($rows) => $rows->sortByDesc('created_at')->values());

        $subjectCodes = DB::table('subjects')->pluck('subject_code', 'id');

        $stats = ['term_current' => 0, 'term_history' => 0, 'term_missing' => 0,
                  'section_current' => 0, 'section_single' => 0, 'section_ambiguous' => 0];

        foreach ($grades as $grade) {
            $student = $students->get($grade->pre_enrolled_student_id);
            if (!$student) continue;

            $changes = [];

            // ── Term ──────────────────────────────────────────────────────
            if (!$grade->school_year) {
                $stillEnrolled = in_array($grade->subject_id, $studentSubjects->get($grade->pre_enrolled_student_id, []));

                if ($stillEnrolled) {
                    $changes['school_year'] = $student->school_year;
                    $changes['semester']    = $student->semester;
                    $changes['year']        = $student->year;
                    $stats['term_current']++;
                } else {
                    $code = $subjectCodes[$grade->subject_id] ?? null;
                    $match = $histories->get($grade->pre_enrolled_student_id, collect())
                        ->first(function ($history) use ($code) {
                            $taken = collect($history->subjects_taken ?? []);
                            return $code && $taken->contains(fn ($s) => ($s['subject_code'] ?? null) === $code);
                        });

                    if ($match) {
                        $changes['school_year'] = $match->school_year;
                        $changes['semester']    = $match->semester;
                        $changes['year']        = $match->year;
                        $stats['term_history']++;
                    } else {
                        $stats['term_missing']++;
                    }
                }
            }

            // ── Section ───────────────────────────────────────────────────
            if (!$grade->section_id) {
                $taught = $scheduleSections->get("{$grade->subject_id}|{$grade->instructor_id}", collect());
                $current = $studentSections->get($grade->pre_enrolled_student_id, []);
                $overlap = $taught->intersect($current)->values();

                if ($overlap->count() === 1) {
                    $changes['section_id'] = $overlap->first();
                    $stats['section_current']++;
                } elseif ($taught->count() === 1) {
                    $changes['section_id'] = $taught->first();
                    $stats['section_single']++;
                } else {
                    $stats['section_ambiguous']++;
                }
            }

            if ($changes && !$dryRun) {
                Grade::where('id', $grade->id)->update($changes);
            }
        }

        $this->newLine();
        $this->line("Term from current enrollment : {$stats['term_current']}");
        $this->line("Term from archived history   : {$stats['term_history']}");
        $this->line("Term could not be determined : {$stats['term_missing']}");
        $this->line("Section from current section : {$stats['section_current']}");
        $this->line("Section from sole schedule   : {$stats['section_single']}");
        $this->line("Section left blank (unclear) : {$stats['section_ambiguous']}");

        $this->info($dryRun ? 'Dry run — nothing was written.' : 'Backfill complete.');

        return self::SUCCESS;
    }
}
