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
 * Once per term, not once per student: a continuing student re-enrolling for
 * a new semester is owed the same notice, and the term they were last told
 * about is what decides it. Claims the row before sending, so an approval and
 * a re-approval landing together cannot send the confirmation twice. A send
 * that fails puts the previous stamp back, leaving it to be retried rather
 * than silently lost.
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
            ->first();

        if (!$student) {
            return;
        }

        $term = $student->termKey();
        $notifiedTerm = $student->enrolled_notified_term;

        // Already told about this exact term. A re-approval of the same
        // semester is not news.
        if ($notifiedTerm === $term) {
            return;
        }

        $email = trim((string) $student->email_address);

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Enrollment approved: no usable email on file.', [
                'student_id' => $student->id,
                'term' => $term,
            ]);

            return;
        }

        $notifiedAt = $student->enrolled_notified_at;

        // The claim. Whoever's statement changes the row owns the send;
        // everyone else gets 0 back and walks away.
        $claimed = DB::table('pre_enrolled_students')
            ->where('id', $student->id)
            ->where(function ($query) use ($term) {
                $query->whereNull('enrolled_notified_term')
                    ->orWhere('enrolled_notified_term', '!=', $term);
            })
            ->update([
                'enrolled_notified_term' => $term,
                'enrolled_notified_at' => now(),
            ]);

        if (!$claimed) {
            return;
        }

        try {
            // Never told before means this is their first term, so the notice
            // carries the whole record they filed. Every term after that is a
            // certificate of registration: the term's subjects, nothing more.
            Mail::to($email)->send(new EnrollmentApprovedMail($student, $notifiedTerm === null));
        } catch (\Throwable $e) {
            DB::table('pre_enrolled_students')
                ->where('id', $student->id)
                ->update([
                    'enrolled_notified_term' => $notifiedTerm,
                    'enrolled_notified_at' => $notifiedAt,
                ]);

            Log::error('Enrollment approved email failed to send.', [
                'student_id' => $student->id,
                'email' => $email,
                'term' => $term,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
