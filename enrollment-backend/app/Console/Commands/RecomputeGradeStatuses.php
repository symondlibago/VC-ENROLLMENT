<?php

namespace App\Console\Commands;

use App\Models\Grade;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Brings every stored grade status back in line with the marks on its row.
 *
 * College used to be judged on its final period while every screen showed the
 * four-period average, so a student could read 80 and a 2.7 beside the word
 * Failed. The rule is one figure now — Grade::derivedStatus — but the records
 * written under the old one still say what they said. Re-saving each grade by
 * hand would fix them one at a time; this does the same thing in one pass.
 *
 * Safe to run more than once: a row already agreeing with its marks is left
 * alone, so a second run reports nothing to do.
 */
class RecomputeGradeStatuses extends Command
{
    protected $signature = 'grades:recompute
        {--dry-run : Report what would change without writing anything}
        {--skip-dropped : Leave all-zero rows as they are instead of marking them Dropped}';

    protected $description = 'Re-derive stored grade statuses from the marks on each row';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $skipDropped = (bool) $this->option('skip-dropped');

        $counts = ['status' => 0, 'held' => 0, 'dropped' => 0, 'manual' => 0, 'unchanged' => 0];
        $samples = [];

        $apply = function () use (&$counts, &$samples, $dryRun, $skipDropped) {
            Grade::with('student:id,year,student_id_number')
                ->chunkById(500, function ($grades) use (&$counts, &$samples, $dryRun, $skipDropped) {
                    foreach ($grades as $grade) {
                        // A remark somebody chose outranks anything derived
                        if ($grade->hasManualRemark()) {
                            $counts['manual']++;
                            continue;
                        }

                        $derived = $grade->derivedStatus();

                        /*
                         * A part-marked row is left alone rather than pulled
                         * back to "In Progress". Some carry a result for
                         * reasons the marks do not show — a credited transfer,
                         * a grade entered before the periods were — and this
                         * command is here to correct arithmetic, not to erase
                         * results it cannot account for.
                         */
                        if ($derived === 'In Progress') {
                            $counts['unchanged']++;
                            continue;
                        }

                        if ($skipDropped && $derived === Grade::DROPPED) {
                            $counts['unchanged']++;
                            continue;
                        }

                        // A held grade keeps reading INC; what needs correcting
                        // is the result it is holding
                        $field = $grade->clearance_hold ? 'held_status' : 'status';

                        if ($grade->{$field} === $derived) {
                            $counts['unchanged']++;
                            continue;
                        }

                        if (count($samples) < 10) {
                            $samples[] = [
                                $grade->id,
                                $grade->student->student_id_number ?? '—',
                                trim(sprintf(
                                    '%s/%s/%s/%s',
                                    $grade->prelim_grade ?? '-', $grade->midterm_grade ?? '-',
                                    $grade->semifinal_grade ?? '-', $grade->final_grade ?? '-'
                                )),
                                (string) $grade->computedFinalGrade(),
                                $grade->{$field},
                                $derived,
                            ];
                        }

                        if ($derived === Grade::DROPPED) {
                            $counts['dropped']++;
                        } else {
                            $counts[$field === 'held_status' ? 'held' : 'status']++;
                        }

                        if (!$dryRun) {
                            // Saved without touching updated_at: this corrects
                            // what the row always meant, it is not somebody
                            // marking the grade again today
                            $grade->timestamps = false;
                            $grade->{$field} = $derived;
                            $grade->save();
                        }
                    }
                });
        };

        if ($dryRun) {
            $apply();
        } else {
            DB::transaction($apply);
        }

        if ($samples) {
            $this->newLine();
            $this->table(
                ['Grade', 'Student', 'Marks', 'Final', 'Was', 'Now'],
                $samples
            );
            $this->line('  (first ' . count($samples) . ' of the rows affected)');
        }

        $this->newLine();
        $this->table(['What', 'Rows'], [
            ['Pass/fail corrected', $counts['status']],
            ['Held result corrected', $counts['held']],
            ['Marked Dropped', $counts['dropped']],
            ['Left alone (a chosen remark)', $counts['manual']],
            ['Left alone (already correct)', $counts['unchanged']],
        ]);

        $changed = $counts['status'] + $counts['held'] + $counts['dropped'];

        if ($dryRun) {
            $this->warn("Dry run — nothing was written. {$changed} row(s) would change.");
        } elseif ($changed === 0) {
            $this->info('Every grade already agrees with its marks.');
        } else {
            $this->info("{$changed} row(s) corrected.");
        }

        return self::SUCCESS;
    }
}
