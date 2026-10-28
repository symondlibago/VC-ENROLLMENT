<?php

namespace App\Mail;

use App\Models\Clearance;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The notice a student gets the moment the last signature on their clearance
 * lands — who signed, when, and what it releases.
 */
class ClearanceClearedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Clearance $clearance,
        public int $releasedGrades = 0,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're cleared — {$this->clearance->term_label}",
        );
    }

    public function content(): Content
    {
        // loadMissing rather than load: the job hands this over eager-loaded,
        // and a second round of queries per student across a bulk approval is
        // exactly the cost that makes a notice worth skipping.
        $this->clearance->loadMissing(['student.course', 'items.role', 'items.approver']);

        $signatories = $this->clearance->items
            ->filter(fn ($item) => $item->role?->is_active)
            ->sortBy(fn ($item) => $item->role->sort_order)
            ->values();

        return new Content(
            view: 'emails.clearance.cleared',
            with: [
                'clearance' => $this->clearance,
                'student' => $this->clearance->student,
                'signatories' => $signatories,
                'releasedGrades' => $this->releasedGrades,
            ],
        );
    }
}
