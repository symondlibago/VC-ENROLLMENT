<?php

namespace App\Mail;

use App\Models\CredentialRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The claim stub the registrar sends once a credential request is released:
 * what was requested, and when it can be picked up.
 */
class CredentialClaimStubMail extends Mailable
{
    use Queueable, SerializesModels;

    public CredentialRequest $credentialRequest;

    public function __construct(CredentialRequest $credentialRequest)
    {
        $this->credentialRequest = $credentialRequest;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your credential request is ready — claim stub {$this->credentialRequest->request_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.credentials.claim-stub',
            with: [
                'request' => $this->credentialRequest,
                'credentials' => $this->credentialRequest->credentialLines(),
                'purposes' => $this->credentialRequest->purposeLabels(),
            ],
        );
    }
}
