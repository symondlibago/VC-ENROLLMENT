<?php

namespace App\Jobs;

use App\Mail\ClearanceClearedMail;
use App\Models\Clearance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Tells students their clearance came through.
 *
 * Carries ids rather than models so it survives being queued, and claims each
 * row before sending so the same student cannot be emailed twice — which
 * matters because a cashier signing the last line and an admin running a bulk
 * approval can land on the same clearance at the same moment.
 *
 * A send that fails gives the row back, so the next time that clearance is
 * recomputed the student is told rather than silently missed.
 */
class SendClearanceClearedEmails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    /**
     * @param  array<int>  $clearanceIds
     * @param  array<int, int>  $releasedGrades  clearance id => grades taken off hold
     */
    public function __construct(
        public array $clearanceIds,
        public array $releasedGrades = [],
    ) {
        // Wait for the work that cleared them to commit. Set through the
        // trait's own setter rather than by redeclaring its property, which
        // PHP rejects as an incompatible composition.
        $this->afterCommit();
    }

    public function handle(): void
    {
        if (!$this->clearanceIds) {
            return;
        }

        // Chunked so a term-wide approval does not pull eight hundred
        // clearances and their signature lines into memory at once.
        foreach (array_chunk(array_unique($this->clearanceIds), 100) as $chunk) {
            $clearances = Clearance::with(['student.course', 'items.role', 'items.approver'])
                ->whereIn('id', $chunk)
                // Students only. A faculty clearance has no student to write
                // to, and the College does not email its own staff about one.
                ->forStudents()
                ->where('status', 'cleared')
                ->whereNull('cleared_notified_at')
                ->get();

            foreach ($clearances as $clearance) {
                $this->notify($clearance);
            }
        }
    }

    /**
     * Sends one notice, having first taken ownership of the row.
     */
    private function notify(Clearance $clearance): void
    {
        $email = trim((string) $clearance->student?->email_address);

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Clearance cleared: no usable email on file.', [
                'clearance_id' => $clearance->id,
                'student_id' => $clearance->pre_enrolled_student_id,
            ]);

            return;
        }

        // The claim. A conditional update is what makes this safe: whoever's
        // statement changes the row owns the send, and everyone else gets 0
        // back and walks away. Checking first and then writing would leave a
        // window for both to pass.
        $claimed = DB::table('clearances')
            ->where('id', $clearance->id)
            ->whereNull('cleared_notified_at')
            ->update(['cleared_notified_at' => now()]);

        if (!$claimed) {
            return;
        }

        try {
            Mail::to($email)->send(
                new ClearanceClearedMail($clearance, $this->releasedGrades[$clearance->id] ?? 0)
            );
        } catch (\Throwable $e) {
            // Hand the row back so a later recompute can try again, and never
            // let one bad address stop the rest of the batch.
            DB::table('clearances')
                ->where('id', $clearance->id)
                ->update(['cleared_notified_at' => null]);

            Log::error('Clearance cleared email failed to send.', [
                'clearance_id' => $clearance->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
