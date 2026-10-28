<?php

namespace App\Jobs;

use App\Mail\EnrollmentApprovedMail;
use App\Models\PreEnrolledStudent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Tells a student their enrollment is official.
 *
 * Claims the row before sending, so an approval and a re-approval landing
 * together cannot send the confirmation twice. A send that fails gives the
 * row back, leaving it to be retried rather than silently lost.
 */
class SendEnrollmentApprovedEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public int $studentId)
    {
        $this->afterCommit();
    }

    public function handle(): void
    {
        $student = PreEnrolledStudent::with([
            'course.program', 'subjects', 'sections', 'enrollmentCode', 'enrollmentApprovals.user',
        ])
            ->where('id', $this->studentId)
            ->where('enrollment_status', 'enrolled')
            ->whereNull('enrolled_notified_at')
            ->first();

        if (!$student) {
            return;
        }

        $email = trim((string) $student->email_address);

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Enrollment approved: no usable email on file.', ['student_id' => $student->id]);

            return;
        }

        // The claim. Whoever's statement changes the row owns the send;
        // everyone else gets 0 back and walks away.
        $claimed = DB::table('pre_enrolled_students')
            ->where('id', $student->id)
            ->whereNull('enrolled_notified_at')
            ->update(['enrolled_notified_at' => now()]);

        if (!$claimed) {
            return;
        }

        try {
            Mail::to($email)->send(new EnrollmentApprovedMail($student));
        } catch (\Throwable $e) {
            DB::table('pre_enrolled_students')
                ->where('id', $student->id)
                ->update(['enrolled_notified_at' => null]);

            Log::error('Enrollment approved email failed to send.', [
                'student_id' => $student->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
