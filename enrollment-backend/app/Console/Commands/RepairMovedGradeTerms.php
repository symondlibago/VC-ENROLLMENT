<?php

namespace App\Console\Commands;

use App\Models\Clearance;
use App\Models\EnrollmentHistory;
use App\Models\Grade;
use App\Models\PreEnrolledStudent;
use App\Services\ClearanceService;
use App\Services\IncRecordService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Puts back the term on grades whose stamp followed the student into the next
 * one.
 *
 * Until it was fixed, saving a grade re-stamped it with the term the student
 * was sitting in at that moment. That is correct the first time, and wrong
 * every time after the student re-enrolls: a finished first-semester result
 * saved once more would start claiming to belong to second semester. Two
 * things then break at once — the grade drops off first semester's grading
 * sheet, and the clearance gate looks for a second-semester clearance that
 * nobody has signed yet, so a passing grade sits at INC and will not edit back.
 *
 * A row is only moved when all three hold:
 *   1. its term is exactly the student's current term, and
 *   2. the student is no longer enrolled in that subject, and
 *   3. an archived enrolment for a different term lists that subject.
 *
 * Anything else is left alone: a grade for a subject the student is still
 * taking is simply current, and a term with nothing to correct it against is
 * not guessed at.
 */
class RepairMovedGradeTerms extends Command
{
    protected $signature = 'grades:repair-moved-terms {--dry-run : Report what would change without writing}';

    protected $description = 'Restore the term on grades re-stamped with the term the student moved to';

    public function handle(ClearanceService $clearances): int
    {
        $dryRun = $this->option('dry-run');

        $students = PreEnrolledStudent::with('course.program')->get()->keyBy('id');

        $enrolledIn = DB::table('student_subject')
            ->get(['pre_enrolled_student_id', 'subject_id'])
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($rows) => $rows->pluck('subject_id')->all());

        $subjectCodes = DB::table('subjects')->pluck('subject_code', 'id');

        $histories = EnrollmentHistory::all()
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($rows) => $rows->sortByDesc('created_at')->values());

        $moved = 0;
        $released = 0;
        $becameInc = 0;
        $stillHeld = 0;

        $rows = [];

        Grade::with(['subject:id,subject_code'])
            ->whereNotNull('school_year')
            ->chunkById(500, function ($grades) use (
                $students, $enrolledIn, $subjectCodes, $histories, $clearances,
                $dryRun, &$moved, &$released, &$becameInc, &$stillHeld, &$rows
            ) {
                foreach ($grades as $grade) {
                    $student = $students->get($grade->pre_enrolled_student_id);
                    if (!$student) {
                        continue;
                    }

                    // Still taking it: the stamp is current, and current is correct.
                    if (in_array($grade->subject_id, $enrolledIn->get($grade->pre_enrolled_student_id, []), false)) {
                        continue;
                    }

                    // Only a stamp that matches where the student sits now is suspect.
                    if ($grade->school_year !== $student->school_year
                        || $grade->semester !== $student->semester) {
                        continue;
                    }

                    // The most recent archived term that names this subject and is not
                    // the term the grade already claims.
                    $code = $subjectCodes[$grade->subject_id] ?? null;
                    if ($code === null) {
                        continue;
                    }

                    $real = $histories->get($grade->pre_enrolled_student_id, collect())
                        ->first(function (EnrollmentHistory $history) use ($code, $grade) {
                            $names = collect($history->subjects_taken ?? [])
                                ->contains(fn ($taken) => ($taken['subject_code'] ?? null) === $code);

                            return $names
                                && !($history->school_year === $grade->school_year
                                     && $history->semester === $grade->semester);
                        });

                    if (!$real) {
                        continue;
                    }

                    $was = "{$grade->school_year} {$grade->semester}";
                    $grade->school_year = $real->school_year;
                    $grade->semester    = $real->semester;
                    $grade->year        = $real->year ?? $grade->year;
                    $moved++;

                    // ── Settle the hold the wrong term caused ────────────────
                    //
                    // The rule the whole hold turns on is the order of events: a
                    // grade finalised while the student was already cleared is
                    // never held at all. Under the term it really belongs to,
                    // these clearances were signed weeks before the grade came
                    // in — so no INC was ever incurred and the result is simply
                    // released. Only a grade that was genuinely finalised first
                    // and cleared second becomes a real, payable INC.
                    $outcome = 'term only';

                    if ($grade->clearance_hold) {
                        $term = $clearances->termOf($student, $grade->school_year, $grade->semester);

                        $clearance = $term
                            ? Clearance::where('pre_enrolled_student_id', $student->id)
                                ->where('school_year', $term['school_year'])
                                ->where('semester', $term['semester'])
                                ->where('status', 'cleared')
                                ->first()
                            : null;

                        if (!$clearance) {
                            $stillHeld++;
                            $outcome = 'stays held';
                        } elseif ($grade->held_at === null
                            || $clearance->cleared_at === null
                            || $grade->held_at->greaterThanOrEqualTo($clearance->cleared_at)) {
                            $grade->status = $grade->held_status ?: 'Passed';
                            $grade->clearance_hold = false;
                            $grade->held_status = null;
                            $grade->held_at = null;
                            $released++;
                            $outcome = "released to {$grade->status}";
                        } else {
                            // Held before the clearance was signed: the same
                            // settlement releaseHolds() performs.
                            $grade->status = 'INC';
                            $grade->clearance_hold = false;
                            $becameInc++;
                            $outcome = 'becomes a real INC';
                        }
                    }

                    $rows[] = [
                        $student->getFullNameAttribute(),
                        $grade->subject->subject_code ?? "#{$grade->subject_id}",
                        $was,
                        "{$grade->school_year} {$grade->semester}",
                        $outcome,
                    ];

                    if (!$dryRun) {
                        $grade->save();

                        if ($outcome === 'becomes a real INC') {
                            IncRecordService::syncForGrade($grade);
                        }
                    }
                }
            });

        if ($rows) {
            $this->table(['Student', 'Subject', 'Stamped', 'Belongs to', 'Outcome'], $rows);
        }

        $this->newLine();
        $this->line("Grades put back in their own term : {$moved}");
        $this->line("Results released, no INC incurred : {$released}");
        $this->line("Holds that became a real INC      : {$becameInc}");
        $this->line("Holds kept (still not cleared)    : {$stillHeld}");

        $this->info($dryRun ? 'Dry run — nothing was written.' : 'Repair complete.');

        return self::SUCCESS;
    }
}
