@extends('emails.layout')

@section('title', 'Officially Enrolled')
@section('department', 'Office of the Registrar')
@section('preheader')
    Your enrollment for {{ $student->semester }}, {{ $student->school_year }} is approved. Your subjects are inside.
@endsection

@section('content')
    @php
        $firstName = trim((string) $student->first_name) ?: 'there';
        $code = $student->enrollmentCode->code ?? null;
        $section = $student->sections->first()->name ?? null;

        /** A labelled row, since this email is mostly labelled rows. */
        $row = fn ($label, $value) => trim((string) $value) === ''
            ? ''
            : '<tr><td style="padding:6px 0; color:#9ca3af; width:170px; vertical-align:top;">' . e($label)
                . '</td><td style="padding:6px 0; color:#111827;">' . e($value) . '</td></tr>';

        $schooling = array_filter([
            'Elementary' => $student->elementary,
            'Junior High School' => $student->junior_high_school,
            'Senior High School' => $student->senior_high_school,
            'High School' => $student->high_school_non_k12,
            'College' => $student->college,
        ], fn ($v) => trim((string) $v) !== '');
    @endphp

    {{-- Title --}}
    <tr>
        <td style="padding:32px 32px 8px 32px;">
            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#9ca3af; font-weight:600;">
                Enrollment Confirmed &middot; {{ $student->semester }}, {{ $student->school_year }}
            </div>
            <div style="font-size:26px; font-weight:700; color:#111827; margin-top:6px; line-height:1.25;">
                You&rsquo;re officially enrolled.
            </div>
            <div style="font-size:14px; color:#6b7280; margin-top:12px; line-height:1.7;">
                Congratulations, <strong style="color:#111827;">{{ $firstName }}</strong>. Every office has
                approved your enrollment, and your place for this term is confirmed. Everything on record is
                below &mdash; keep this email, it is your copy.
            </div>
        </td>
    </tr>

    {{-- Student number, front and centre --}}
    <tr>
        <td style="padding:22px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px;">
                <tr>
                    <td align="center" style="padding:22px 24px;">
                        <div style="font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:{{ $green }}; font-weight:700;">
                            &#10003; Enrolled &middot; Student Number
                        </div>
                        <div style="font-size:26px; font-weight:700; color:#111827; margin-top:10px; letter-spacing:2px; font-family:'Courier New', Courier, monospace;">
                            {{ $student->student_id_number }}
                        </div>
                        <div style="font-size:13px; color:#4b5563; margin-top:8px;">
                            {{ $student->course->course_name ?? $student->course->course_code ?? '' }}
                            @if ($student->year) &middot; {{ $student->year }} @endif
                            @if ($section) &middot; {{ $section }} @endif
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- Subjects: the part they will actually come back for --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                Your subjects this term
            </div>

            @if ($subjects->isEmpty())
                <div style="font-size:13px; color:#6b7280;">No subjects are recorded against this enrollment.</div>
            @else
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:10px; border-collapse:separate; overflow:hidden;">
                    <tr style="background-color:#fafafa;">
                        <td style="padding:10px 14px; font-size:11px; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; font-weight:700;">Subject</td>
                        <td align="center" style="padding:10px 8px; font-size:11px; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; font-weight:700; white-space:nowrap;">Lec</td>
                        <td align="center" style="padding:10px 8px; font-size:11px; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; font-weight:700; white-space:nowrap;">Lab</td>
                        <td align="center" style="padding:10px 8px; font-size:11px; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; font-weight:700; white-space:nowrap;">Hrs</td>
                        <td align="center" style="padding:10px 14px; font-size:11px; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; font-weight:700; white-space:nowrap;">Units</td>
                    </tr>
                    @foreach ($subjects as $subject)
                        <tr style="background-color:{{ $loop->even ? '#fafafa' : '#ffffff' }};">
                            <td style="padding:12px 14px; font-size:13px; color:#111827; border-top:1px solid #f0f0f0;">
                                <strong>{{ $subject->subject_code }}</strong>
                                <div style="font-size:12px; color:#6b7280; margin-top:3px;">{{ $subject->descriptive_title }}</div>
                            </td>
                            <td align="center" style="padding:12px 8px; font-size:13px; color:#4b5563; border-top:1px solid #f0f0f0;">{{ $subject->lec_hrs ?: '—' }}</td>
                            <td align="center" style="padding:12px 8px; font-size:13px; color:#4b5563; border-top:1px solid #f0f0f0;">{{ $subject->lab_hrs ?: '—' }}</td>
                            <td align="center" style="padding:12px 8px; font-size:13px; color:#4b5563; border-top:1px solid #f0f0f0;">{{ $subject->number_of_hours ?: '—' }}</td>
                            <td align="center" style="padding:12px 14px; font-size:13px; color:#111827; font-weight:600; border-top:1px solid #f0f0f0;">{{ $subject->total_units ?: '—' }}</td>
                        </tr>
                    @endforeach
                    <tr style="background-color:#fdf3f3;">
                        <td style="padding:12px 14px; font-size:12px; color:{{ $red }}; font-weight:700; border-top:1px solid #f0d4d4;">
                            {{ $subjects->count() }} subject{{ $subjects->count() === 1 ? '' : 's' }}
                        </td>
                        <td colspan="2" style="border-top:1px solid #f0d4d4;"></td>
                        <td align="center" style="padding:12px 8px; font-size:13px; color:{{ $red }}; font-weight:700; border-top:1px solid #f0d4d4;">
                            {{ rtrim(rtrim(number_format($totalHours, 1), '0'), '.') ?: '0' }}
                        </td>
                        <td align="center" style="padding:12px 14px; font-size:13px; color:{{ $red }}; font-weight:700; border-top:1px solid #f0d4d4;">
                            {{ rtrim(rtrim(number_format($totalUnits, 1), '0'), '.') ?: '0' }}
                        </td>
                    </tr>
                </table>
            @endif
        </td>
    </tr>

    {{-- Who approved it --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                Approved by
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:10px; border-collapse:separate; overflow:hidden;">
                @foreach ($approvals as $approval)
                    <tr style="background-color:{{ $loop->even ? '#fafafa' : '#ffffff' }};">
                        <td style="padding:12px 16px; font-size:14px; color:#111827; border-top:{{ $loop->first ? '0' : '1px solid #f0f0f0' }};">
                            {{ $approval->role }}
                            @if ($approval->user?->name)
                                <div style="font-size:12px; color:#6b7280; margin-top:3px;">{{ $approval->user->name }}</div>
                            @endif
                        </td>
                        <td align="right" style="padding:12px 16px; font-size:12px; color:#6b7280; white-space:nowrap; border-top:{{ $loop->first ? '0' : '1px solid #f0f0f0' }};">
                            <span style="color:{{ $green }}; font-weight:700;">&#10003;</span>
                            {{ $approval->updated_at?->format('M j, Y') }}
                        </td>
                    </tr>
                @endforeach
            </table>
        </td>
    </tr>

    {{-- Everything on file --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                Your record as filed
            </div>

            <div style="font-size:11px; letter-spacing:0.8px; text-transform:uppercase; color:{{ $red }}; font-weight:700; margin:4px 0 6px;">Personal</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                {!! $row('Full name', $student->full_name) !!}
                {!! $row('Student number', $student->student_id_number) !!}
                @if ($code) {!! $row('Enrollment code', $code) !!} @endif
                {!! $row('Sex', $student->gender) !!}
                {!! $row('Date of birth', $student->birth_date?->format('F j, Y')) !!}
                {!! $row('Place of birth', $student->birth_place) !!}
                {!! $row('Nationality', $student->nationality) !!}
                {!! $row('Civil status', $student->civil_status) !!}
                {!! $row('Religion', $student->religion) !!}
            </table>

            <div style="font-size:11px; letter-spacing:0.8px; text-transform:uppercase; color:{{ $red }}; font-weight:700; margin:18px 0 6px;">Contact</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                {!! $row('Address', $student->address) !!}
                {!! $row('Mobile number', $student->contact_number) !!}
                {!! $row('Email', $student->email_address) !!}
                {!! $row('Facebook', $student->fb_acc) !!}
            </table>

            <div style="font-size:11px; letter-spacing:0.8px; text-transform:uppercase; color:{{ $red }}; font-weight:700; margin:18px 0 6px;">Academic</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                {!! $row('Course', $student->course->course_name ?? $student->course->course_code ?? '') !!}
                {!! $row('Program', $student->course->program->program_name ?? '') !!}
                {!! $row('Year level', $student->year) !!}
                {!! $row('Section', $section) !!}
                {!! $row('Term', $student->semester . ', ' . $student->school_year) !!}
                {!! $row('Enrollment type', $student->enrollment_type) !!}
                {!! $row('Scholarship', $student->scholarship) !!}
            </table>

            @if ($schooling)
                <div style="font-size:11px; letter-spacing:0.8px; text-transform:uppercase; color:{{ $red }}; font-weight:700; margin:18px 0 6px;">Previous schools</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                    @foreach ($schooling as $level => $school)
                        {!! $row($level, $school) !!}
                    @endforeach
                </table>
            @endif

            <div style="font-size:11px; letter-spacing:0.8px; text-transform:uppercase; color:{{ $red }}; font-weight:700; margin:18px 0 6px;">Family &amp; emergency</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                {!! $row('Father', $student->father_name) !!}
                {!! $row('Father&rsquo;s occupation', $student->father_occupation) !!}
                {!! $row('Father&rsquo;s contact', $student->father_contact_number) !!}
                {!! $row('Mother', $student->mother_name) !!}
                {!! $row('Mother&rsquo;s occupation', $student->mother_occupation) !!}
                {!! $row('Mother&rsquo;s contact', $student->mother_contact_number) !!}
                {!! $row('Parents&rsquo; address', $student->parents_address) !!}
                {!! $row('In case of emergency', $student->emergency_contact_name) !!}
                {!! $row('Emergency contact', $student->emergency_contact_number) !!}
                {!! $row('Emergency address', $student->emergency_contact_address) !!}
            </table>

            <div style="font-size:12px; color:#9ca3af; margin-top:16px; line-height:1.6;">
                If anything above is wrong, contact the Office of the Registrar so it can be corrected on your
                permanent record.
            </div>
        </td>
    </tr>

    {{-- The acknowledgement they accepted, quoted in full --}}
    <tr>
        <td style="padding:28px 32px 0 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                {{ $acknowledgement['title'] }}
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e5e7eb; border-radius:10px;">
                <tr>
                    <td style="padding:20px 22px;">
                        @if ($student->acknowledgement_accepted_at)
                            <div style="font-size:13px; color:#374151; line-height:1.7; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid #e5e7eb;">
                                Accepted on
                                <strong style="color:#111827;">{{ $student->acknowledgement_accepted_at->format('F j, Y \a\t g:i A') }}</strong>
                                &middot; version {{ $student->acknowledgement_version ?? $acknowledgement['version'] }}
                            </div>
                        @endif

                        <div style="font-size:13px; color:#4b5563; line-height:1.7; margin-bottom:16px;">
                            {{ $acknowledgement['intro'] }}
                        </div>

                        @foreach ($acknowledgement['clauses'] as $clause)
                            <div style="margin-bottom:14px;">
                                <div style="font-size:13px; font-weight:700; color:#111827;">
                                    {{ $clause['number'] }}. {{ $clause['heading'] }}
                                </div>
                                @foreach ($clause['paragraphs'] as $paragraph)
                                    <div style="font-size:13px; color:#4b5563; margin-top:4px; line-height:1.7;">{{ $paragraph }}</div>

                                    {{-- Clause 3 cites the handbook between its two paragraphs --}}
                                    @if ($loop->first && $clause['link'])
                                        <div style="font-size:13px; margin-top:6px;">
                                            @if ($clause['link']['url'])
                                                <a href="{{ $clause['link']['url'] }}" style="color:{{ $red }}; font-weight:600;">{{ $clause['link']['label'] }}</a>
                                            @else
                                                <span style="color:#6b7280;">{{ $clause['link']['label'] }}
                                                    <em style="color:#9ca3af;">(link to be provided by the College)</em></span>
                                            @endif
                                        </div>
                                    @endif
                                @endforeach
                            </div>
                        @endforeach

                        <div style="font-size:13px; color:#4b5563; line-height:1.7; margin-top:16px; padding-top:14px; border-top:1px solid #e5e7eb;">
                            {{ $acknowledgement['closing'] }}
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- What to do now --}}
    <tr>
        <td style="padding:28px 32px 32px 32px;">
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:10px;">
                What to do now
            </div>
            <div style="font-size:13px; color:#4b5563; line-height:1.8;">
                &bull; Note your student number &mdash; you will use it for everything from here on.<br>
                &bull; Check your class schedule with your Program Head before classes begin.<br>
                &bull; Keep your receipts; you will need them when you claim your student ID.<br>
                &bull; Keep this email as your copy of what the College has on record for you.
            </div>
        </td>
    </tr>
@endsection
