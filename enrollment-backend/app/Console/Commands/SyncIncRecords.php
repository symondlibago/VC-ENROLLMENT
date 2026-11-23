<?php

namespace App\Console\Commands;

use App\Models\Grade;
use App\Models\IncRecord;
use App\Services\IncRecordService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Opens the completion record for every grade that should have one.
 *
 * A record is created by IncRecordService when a grade is saved or a
 * clearance is released — never on its own. So when NFE and NFR joined INC as
 * payable remarks, the grades already carrying those marks were left behind:
 * the rule had changed, but nothing had touched those rows since, and the INC
 * page only ever lists records, not grades.
 *
 * Opening only. A record that exists but no longer applies is reported and
 * left alone, because withdrawing one is a decision about work somebody may
 * already have started — the ordinary save path handles that case properly.
 */
class SyncIncRecords extends Command
{
    protected $signature = 'inc:sync-records {--dry-run : Report what would change without writing}';

    protected $description = 'Open completion records for payable grades (INC, NFE, NFR) that have none';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->line('Payable remarks: ' . implode(', ', Grade::PAYABLE_REMARKS));

        // Every record already on file, keyed the way IncRecordService looks
        // one up, so a grade is not given a second.
        $existing = IncRecord::select('pre_enrolled_student_id', 'subject_id', 'school_year', 'semester')
            ->get()
            ->map(fn ($r) => "{$r->pre_enrolled_student_id}|{$r->subject_id}|{$r->school_year}|{$r->semester}")
            ->flip();

        $opened = 0;
        $already = 0;
        $skipped = 0;
        $rows = [];

        Grade::with(['student', 'subject:id,subject_code'])
            ->needingCompletion()
            ->chunkById(500, function ($grades) use ($existing, $dryRun, &$opened, &$already, &$skipped, &$rows) {
                foreach ($grades as $grade) {
                    if (!$grade->student) {
                        $skipped++;

                        continue;
                    }

                    // The same term IncRecordService resolves, so the key here
                    // and the row it would write cannot disagree.
                    $schoolYear = $grade->school_year ?? $grade->student->school_year;
                    $semester = $grade->semester ?? $grade->student->semester;

                    if ($existing->has("{$grade->pre_enrolled_student_id}|{$grade->subject_id}|{$schoolYear}|{$semester}")) {
                        $already++;

                        continue;
                    }

                    $opened++;
                    $rows[] = [
                        $grade->student->getFullNameAttribute(),
                        $grade->subject->subject_code ?? "#{$grade->subject_id}",
                        $grade->status,
                        trim("{$semester} {$schoolYear}") ?: '(no term)',
                    ];

                    if (!$dryRun) {
                        IncRecordService::syncForGrade($grade);
                    }
                }
            });

        if ($rows) {
            $this->table(['Student', 'Subject', 'Remark', 'Term'], $rows);
        }

        // The other direction, reported rather than acted on
        $stale = IncRecord::where('status', 'awaiting_payment')
            ->whereHas('grade', fn ($q) => $q->where(function ($inner) {
                $inner->whereNotIn('status', Grade::PAYABLE_REMARKS)
                    ->orWhere('clearance_hold', true);
            }))
            ->count();

        $this->newLine();
        $this->line('Records opened                : ' . $opened);
        $this->line('Grades that already had one   : ' . $already);
        $this->line('Grades with no student on file: ' . $skipped);
        $this->line('Records no longer applicable  : ' . $stale . ' (left alone)');

        if ($opened > 0 && !$dryRun) {
            $byRemark = DB::table('inc_records')
                ->select('grade_remark', DB::raw('COUNT(*) as n'))
                ->groupBy('grade_remark')->pluck('n', 'grade_remark');

            $this->newLine();
            foreach ($byRemark as $remark => $count) {
                $this->line(sprintf('  %-6s %d record(s)', $remark ?: '(none)', $count));
            }
        }

        $this->info($dryRun ? 'Dry run — nothing was written.' : 'Done.');

        return self::SUCCESS;
    }
}
