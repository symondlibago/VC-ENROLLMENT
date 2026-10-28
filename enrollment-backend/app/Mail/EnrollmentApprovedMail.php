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
 * The confirmation that goes out once the last approval lands — the student's
 * full record as filed, every subject they are enrolled in, who signed off,
 * and the acknowledgement they accepted.
 *
 * Written to be the one email a student keeps: everything the registrar holds
 * on them for this term, in a form they can read on a phone or print.
 */
class EnrollmentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public PreEnrolledStudent $student)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're officially enrolled — {$this->student->semester}, {$this->student->school_year}",
        );
    }

    public function content(): Content
    {
        $this->student->loadMissing([
            'course.program',
            'subjects',
            'sections',
            'enrollmentCode',
            'enrollmentApprovals.user',
        ]);

        $subjects = $this->student->subjects;

        return new Content(
            view: 'emails.enrollment.approved',
            with: [
                'student' => $this->student,
                'subjects' => $subjects,
                'totalUnits' => $subjects->sum(fn ($subject) => (float) $subject->total_units),
                'totalHours' => $subjects->sum(fn ($subject) => (float) $subject->number_of_hours),
                'approvals' => $this->student->enrollmentApprovals
                    ->whereIn('role', ['Program Head', 'Registrar', 'Cashier'])
                    ->sortBy(fn ($approval) => array_search(
                        $approval->role,
                        ['Program Head', 'Registrar', 'Cashier'],
                        true
                    ))
                    ->values(),
                'acknowledgement' => EnrollmentAcknowledgement::payload(),
            ],
        );
    }
}
