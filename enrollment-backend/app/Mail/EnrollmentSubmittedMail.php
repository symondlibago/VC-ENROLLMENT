<?php

namespace App\Mail;

use App\Models\PreEnrolledStudent;
use App\Support\EnrollmentAcknowledgement;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The receipt a student gets the moment their enrollment form lands: what was
 * received, the reference to quote, and what happens next.
 */
class EnrollmentSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public PreEnrolledStudent $student)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'We have your enrollment form — ' . $this->student->school_year,
        );
    }

    public function content(): Content
    {
        $this->student->loadMissing(['course', 'subjects', 'sections', 'enrollmentCode']);

        return new Content(
            view: 'emails.enrollment.submitted',
            with: [
                'student' => $this->student,
                'subjects' => $this->student->subjects,
                'acknowledgement' => EnrollmentAcknowledgement::payload(),
            ],
        );
    }
}
