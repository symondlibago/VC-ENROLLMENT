@extends('emails.layout')

@section('title', 'Enrollment Form Received')
@section('department', 'Office of the Registrar')
@section('preheader')
    We have your enrollment form for {{ $student->semester }}, {{ $student->school_year }}. Approvals come next.
@endsection

@section('content')
    @php
        $firstName = trim((string) $student->first_name) ?: 'there';
        $code = $student->enrollmentCode->code ?? null;
        $steps = [
            ['name' => 'Form received', 'note' => 'Done — we have everything you submitted.', 'done' => true],
            ['name' => 'Program Head', 'note' => 'Checks your course, year level and subjects.', 'done' => false],
            ['name' => 'Registrar', 'note' => 'Verifies your records and credentials.', 'done' => false],
            ['name' => 'Cashier', 'note' => 'Settles your fees. This is the final step.', 'done' => false],
        ];
    @endphp

    {{-- Title --}}
    <tr>
        <td style="padding:32px 32px 8px 32px;">
            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#9ca3af; font-weight:600;">
                Enrollment &middot; {{ $student->semester }}, {{ $student->school_year }}
            </div>
            <div style="font-size:26px; font-weight:700; color:#111827; margin-top:6px; line-height:1.25;">
                We&rsquo;ve got your form.
            </div>
            <div style="font-size:14px; color:#6b7280; margin-top:12px; line-height:1.7;">
                Hi <strong style="color:#111827;">{{ $firstName }}</strong>, thank you for submitting your enrollment
                form. It is now with our offices for review. You do not need to do anything else for the moment
                &mdash; we will email you again the moment it is approved.
            </div>
        </td>
    </tr>

    @if ($code)
        {{-- The reference, given its own space because it is the one thing
             they will be asked for at a counter --}}
        <tr>
            <td style="padding:22px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3f3; border:1px solid #f0d4d4; border-radius:12px;">
                    <tr>
                        <td align="center" style="padding:22px 24px;">
                            <div style="font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:{{ $red }}; font-weight:700;">
                                Your enrollment code
                            </div>
                            <div style="font-size:26px; font-weight:700; color:#111827; margin-top:10px; letter-spacing:3px; font-family:'Courier New', Courier, monospace;">
                                {{ $code }}
                            </div>
                            <div style="font-size:12px; color:#6b7280; margin-top:10px;">
                                Keep this. You will be asked for it when following up.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    @endif

    {{-- What happens next --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                What happens next
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                @foreach ($steps as $index => $step)
                    <tr>
                        <td width="30" valign="top" style="padding:0 12px 0 0;">
                            <div style="width:22px; height:22px; border-radius:50%; text-align:center; line-height:22px; font-size:11px; font-weight:700;
                                        background-color:{{ $step['done'] ? '#dcfce7' : '#f3f4f6' }};
                                        color:{{ $step['done'] ? $green : '#9ca3af' }};">
                                {{ $step['done'] ? '✓' : $index }}
                            </div>
                        </td>
                        <td valign="top" style="padding-bottom:{{ $loop->last ? '0' : '14px' }};">
                            <div style="font-size:14px; font-weight:600; color:{{ $step['done'] ? '#111827' : '#4b5563' }};">
                                {{ $step['name'] }}
                            </div>
                            <div style="font-size:13px; color:#6b7280; margin-top:2px; line-height:1.6;">
                                {{ $step['note'] }}
                            </div>
                        </td>
                    </tr>
                @endforeach
            </table>
        </td>
    </tr>

    {{-- What we received --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                What we received
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                <tr>
                    <td style="padding:6px 0; color:#9ca3af; width:150px;">Name</td>
                    <td style="padding:6px 0; color:#111827; font-weight:600;">{{ $student->full_name }}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Course</td>
                    <td style="padding:6px 0; color:#111827;">
                        {{ $student->course->course_name ?? $student->course->course_code ?? '—' }}
                    </td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Year level</td>
                    <td style="padding:6px 0; color:#111827;">{{ $student->year }}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Term</td>
                    <td style="padding:6px 0; color:#111827;">{{ $student->semester }}, {{ $student->school_year }}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Subjects</td>
                    <td style="padding:6px 0; color:#111827;">{{ $subjects->count() }} selected</td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Submitted on</td>
                    <td style="padding:6px 0; color:#111827;">{{ $student->created_at?->format('F j, Y \a\t g:i A') }}</td>
                </tr>
            </table>
        </td>
    </tr>

    @if ($student->acknowledgement_accepted_at)
        <tr>
            <td style="padding:24px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-left:3px solid {{ $red }}; border-radius:6px;">
                    <tr>
                        <td style="padding:14px 18px; font-size:13px; color:#374151; line-height:1.7;">
                            <strong style="color:#111827;">You accepted the {{ $acknowledgement['title'] }}</strong>
                            (version {{ $student->acknowledgement_version ?? $acknowledgement['version'] }})
                            on {{ $student->acknowledgement_accepted_at->format('F j, Y \a\t g:i A') }}.
                            The full text is included with your confirmation once your enrollment is approved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    @endif

    {{-- Reminder --}}
    <tr>
        <td style="padding:24px 32px 32px 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:10px;">
                Please note
            </div>
            <div style="font-size:13px; color:#4b5563; line-height:1.8;">
                &bull; Your enrollment is <strong>not final</strong> until all three offices have approved it.<br>
                &bull; If something needs correcting, the Registrar will contact you on the number or email you gave.<br>
                &bull; Fees are settled with the Cashier, who signs last.
            </div>
        </td>
    </tr>
@endsection
