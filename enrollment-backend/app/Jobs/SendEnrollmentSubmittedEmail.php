<?php

namespace App\Jobs;

use App\Mail\EnrollmentSubmittedMail;
use App\Models\PreEnrolledStudent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Tells a student their enrollment form was received.
 *
 * Carries the id, not the model, so a form whose transaction rolled back
 * simply finds nothing to send.
 */
class SendEnrollmentSubmittedEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public int $studentId)
    {
        $this->afterCommit();
    }

    public function handle(): void
    {
        $student = PreEnrolledStudent::with(['course', 'subjects', 'enrollmentCode'])
            ->find($this->studentId);

        if (!$student) {
            return;
        }

        $email = trim((string) $student->email_address);

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Enrollment submitted: no usable email on file.', ['student_id' => $student->id]);

            return;
        }

        try {
            Mail::to($email)->send(new EnrollmentSubmittedMail($student));
        } catch (\Throwable $e) {
            // A receipt that does not arrive must never fail the enrollment
            // itself — the form is already filed either way.
            Log::error('Enrollment submitted email failed to send.', [
                'student_id' => $student->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
