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
 * The confirmation that goes out once the last approval lands.
 *
 * On a student's first term it is everything: the full record as filed, the
 * subjects, who signed off, and the acknowledgement they accepted — the one
 * email they keep, readable on a phone or printable.
 *
 * On every term after that it is a certificate of registration and nothing
 * else. A continuing student did not fill the form again, so reciting their
 * birthplace and their father's occupation back at them each semester would
 * be noise around the part they actually opened the email for.
 */
class EnrollmentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  bool  $firstNotice  Their first enrolled notice, so the whole
     *                             record is included rather than the COR alone.
     */
    public function __construct(
        public PreEnrolledStudent $student,
        public bool $firstNotice = true,
    ) {
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
                'firstNotice' => $this->firstNotice,
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
