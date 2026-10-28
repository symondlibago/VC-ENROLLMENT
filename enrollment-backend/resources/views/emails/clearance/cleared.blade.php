@extends('emails.layout')

@section('title', 'Clearance Cleared')
@section('department', 'Student Clearance')
@section('preheader')
    All {{ $signatories->count() }} signature{{ $signatories->count() === 1 ? '' : 's' }} are in — you are cleared for {{ $clearance->term_label }}.
@endsection

@section('content')
    @php
        $clearedOn = $clearance->cleared_at ? $clearance->cleared_at->format('l, F j, Y') : null;
        $firstName = trim((string) $student?->first_name) ?: 'there';
        $signedCount = $signatories->count();
    @endphp

    {{-- Title --}}
    <tr>
        <td style="padding:32px 32px 8px 32px;">
            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#9ca3af; font-weight:600;">
                Student Clearance &middot; {{ $clearance->term_label }}
            </div>
            <div style="font-size:26px; font-weight:700; color:#111827; margin-top:6px; line-height:1.25;">
                You&rsquo;re all cleared.
            </div>
            <div style="font-size:14px; color:#6b7280; margin-top:12px; line-height:1.7;">
                Hi <strong style="color:#111827;">{{ $firstName }}</strong>, every office has signed off on your
                clearance for <strong style="color:#111827;">{{ $clearance->term_label }}</strong>.
                There is nothing further for you to settle this term.
            </div>
        </td>
    </tr>

    {{-- The confirmation --}}
    <tr>
        <td style="padding:22px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px;">
                <tr>
                    <td style="padding:22px 24px;">
                        <div style="font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:{{ $green }}; font-weight:700;">
                            &#10003; Cleared
                        </div>
                        <div style="font-size:20px; font-weight:700; color:#111827; margin-top:8px;">
                            {{ $clearedOn ?? 'Today' }}
                        </div>
                        <div style="font-size:13px; color:#4b5563; margin-top:6px;">
                            All {{ $signedCount }} signature line{{ $signedCount === 1 ? '' : 's' }} complete
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    @if ($releasedGrades > 0)
        {{-- Only shown when a grade was actually being held back --}}
        <tr>
            <td style="padding:16px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-left:3px solid {{ $red }}; border-radius:6px;">
                    <tr>
                        <td style="padding:14px 18px; font-size:13px; color:#374151; line-height:1.7;">
                            <strong style="color:#111827;">Your grades have been released.</strong><br>
                            {{ $releasedGrades }} subject grade{{ $releasedGrades === 1 ? '' : 's' }} that read
                            <strong>INC</strong> while your clearance was outstanding {{ $releasedGrades === 1 ? 'has' : 'have' }}
                            been restored to the mark you earned. You can view {{ $releasedGrades === 1 ? 'it' : 'them' }} in your student portal.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    @endif

    {{-- The receipt: who signed, and when --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                Signed off by
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:10px; border-collapse:separate; overflow:hidden;">
                @foreach ($signatories as $index => $item)
                    <tr style="background-color:{{ $index % 2 === 0 ? '#ffffff' : '#fafafa' }};">
                        <td style="padding:12px 16px; font-size:14px; color:#111827; border-top:{{ $index === 0 ? '0' : '1px solid #f0f0f0' }};">
                            {{ $item->role->name }}
                            @if ($item->approver?->name)
                                <div style="font-size:12px; color:#6b7280; margin-top:3px;">{{ $item->approver->name }}</div>
                            @endif
                        </td>
                        <td align="right" style="padding:12px 16px; font-size:12px; color:#6b7280; white-space:nowrap; border-top:{{ $index === 0 ? '0' : '1px solid #f0f0f0' }};">
                            <span style="color:{{ $green }}; font-weight:700;">&#10003;</span>
                            @if ($item->approved_at)
                                {{ \Illuminate\Support\Carbon::parse($item->approved_at)->format('M j, Y') }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </table>
        </td>
    </tr>

    {{-- Student details --}}
    <tr>
        <td style="padding:24px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                <tr>
                    <td style="padding:6px 0; color:#9ca3af; width:150px;">Name</td>
                    <td style="padding:6px 0; color:#111827; font-weight:600;">{{ $student?->full_name }}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Student No.</td>
                    <td style="padding:6px 0; color:#111827;">{{ $student?->student_id_number }}</td>
                </tr>
                @if ($student?->course)
                    <tr>
                        <td style="padding:6px 0; color:#9ca3af;">Course &amp; Year</td>
                        <td style="padding:6px 0; color:#111827;">
                            {{ $student->course->course_code ?? $student->course->course_name }}
                            @if ($clearance->year_level) &middot; {{ $clearance->year_level }} @endif
                        </td>
                    </tr>
                @endif
                <tr>
                    <td style="padding:6px 0; color:#9ca3af;">Term</td>
                    <td style="padding:6px 0; color:#111827;">{{ $clearance->term_label }}</td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- What it means --}}
    <tr>
        <td style="padding:24px 32px 32px 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:10px;">
                What this means
            </div>
            <div style="font-size:13px; color:#4b5563; line-height:1.8;">
                &bull; Your grades for this term are released and no longer held at INC.<br>
                &bull; You may enrol for the next term and request documents from the Registrar.<br>
                &bull; Keep this email &mdash; it is your record of who signed and when.
            </div>
        </td>
    </tr>
@endsection
