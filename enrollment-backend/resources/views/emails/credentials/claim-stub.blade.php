@php
    $red = '#9c262c';
    $logo = public_path('circlelogo.png');
    $claimDate = $request->claim_date ? $request->claim_date->format('l, F j, Y') : null;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Credential Claim Stub</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Segoe UI', Helvetica, Arial, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                    {{-- Letterhead --}}
                    <tr>
                        <td style="background-color:{{ $red }}; padding:28px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    @if (file_exists($logo))
                                        <td width="62" valign="middle" style="padding-right:16px;">
                                            <img src="{{ $message->embed($logo) }}" width="56" height="56" alt="VIPC" style="display:block; border-radius:50%; background:#ffffff;">
                                        </td>
                                    @endif
                                    <td valign="middle">
                                        <div style="color:#ffffff; font-size:17px; font-weight:700; line-height:1.3; letter-spacing:0.2px;">
                                            Vineyard International<br>Polytechnic College
                                        </div>
                                        <div style="color:rgba(255,255,255,0.8); font-size:12px; margin-top:6px;">
                                            Office of the Registrar &middot; Cagayan de Oro City
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Title --}}
                    <tr>
                        <td style="padding:32px 32px 8px 32px;">
                            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#9ca3af; font-weight:600;">
                                Credential Request &middot; Claim Stub
                            </div>
                            <div style="font-size:24px; font-weight:700; color:#111827; margin-top:6px;">
                                Your documents are ready to claim
                            </div>
                            <div style="font-size:14px; color:#6b7280; margin-top:10px; line-height:1.6;">
                                Hello <strong style="color:#111827;">{{ $request->student_name }}</strong>, your credential request
                                <strong style="color:{{ $red }};">{{ $request->request_number }}</strong> has been processed and released
                                by the Office of the Registrar.
                            </div>
                        </td>
                    </tr>

                    {{-- Claim schedule --}}
                    <tr>
                        <td style="padding:20px 32px 0 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3f3; border:1px solid #f0d4d4; border-radius:12px;">
                                <tr>
                                    <td style="padding:20px 24px;">
                                        <div style="font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:{{ $red }}; font-weight:700;">
                                            Please claim on
                                        </div>
                                        <div style="font-size:20px; font-weight:700; color:#111827; margin-top:8px;">
                                            {{ $claimDate ?? 'To be announced' }}
                                        </div>
                                        @if ($request->claim_time)
                                            <div style="font-size:14px; color:#4b5563; margin-top:4px;">
                                                at {{ $request->claim_time }}
                                            </div>
                                        @endif
                                        <div style="font-size:13px; color:#6b7280; margin-top:12px; line-height:1.6;">
                                            Office of the Registrar, Prince Padi Bldg., A. Luna Street,<br>
                                            Mabulay Subdivision, Cagayan de Oro City
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Requested documents --}}
                    <tr>
                        <td style="padding:28px 32px 0 32px;">
                            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:12px;">
                                Documents requested
                            </div>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:10px; border-collapse:separate; overflow:hidden;">
                                @foreach ($credentials as $index => $line)
                                    <tr style="background-color:{{ $index % 2 === 0 ? '#ffffff' : '#fafafa' }};">
                                        <td style="padding:12px 16px; font-size:14px; color:#111827; border-top:{{ $index === 0 ? '0' : '1px solid #f0f0f0' }};">
                                            {{ $line['label'] }}
                                            @if (!empty($line['remarks']))
                                                <div style="font-size:12px; color:#6b7280; margin-top:3px;">{{ $line['remarks'] }}</div>
                                            @endif
                                        </td>
                                        <td align="right" style="padding:12px 16px; font-size:13px; color:#6b7280; white-space:nowrap; border-top:{{ $index === 0 ? '0' : '1px solid #f0f0f0' }};">
                                            @if (!empty($line['pages']))
                                                {{ $line['pages'] }} page{{ (int) $line['pages'] === 1 ? '' : 's' }}
                                            @endif
                                        </td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>

                    {{-- Request details --}}
                    <tr>
                        <td style="padding:24px 32px 0 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#4b5563;">
                                <tr>
                                    <td style="padding:6px 0; color:#9ca3af; width:150px;">Name</td>
                                    <td style="padding:6px 0; color:#111827; font-weight:600;">{{ $request->student_name }}</td>
                                </tr>
                                @if ($request->course)
                                    <tr>
                                        <td style="padding:6px 0; color:#9ca3af;">Course</td>
                                        <td style="padding:6px 0; color:#111827;">{{ $request->course }}</td>
                                    </tr>
                                @endif
                                @if (count($purposes))
                                    <tr>
                                        <td style="padding:6px 0; color:#9ca3af;">Purpose</td>
                                        <td style="padding:6px 0; color:#111827;">{{ implode(', ', $purposes) }}</td>
                                    </tr>
                                @endif
                                <tr>
                                    <td style="padding:6px 0; color:#9ca3af;">Requested on</td>
                                    <td style="padding:6px 0; color:#111827;">{{ $request->created_at?->format('F j, Y') }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @if ($request->release_notes)
                        <tr>
                            <td style="padding:24px 32px 0 32px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-left:3px solid {{ $red }}; border-radius:6px;">
                                    <tr>
                                        <td style="padding:14px 18px; font-size:13px; color:#374151; line-height:1.6;">
                                            <strong style="color:#111827;">Note from the Registrar:</strong><br>
                                            {{ $request->release_notes }}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Reminders --}}
                    <tr>
                        <td style="padding:24px 32px 0 32px;">
                            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; font-weight:600; margin-bottom:10px;">
                                Before you come
                            </div>
                            <div style="font-size:13px; color:#4b5563; line-height:1.8;">
                                &bull; Bring a valid ID and present this claim stub (printed or on your phone).<br>
                                &bull; If someone else will claim for you, they must bring an authorization letter and a copy of your ID.<br>
                                &bull; Documents not claimed within 30 days are kept at the Registrar's Office.
                            </div>
                        </td>
                    </tr>

                    {{-- Signature --}}
                    <tr>
                        <td style="padding:28px 32px 32px 32px;">
                            <div style="border-top:1px solid #e5e7eb; padding-top:20px;">
                                <div style="font-size:13px; color:#6b7280;">Released by</div>
                                <div style="font-size:15px; font-weight:700; color:#111827; margin-top:4px;">ARCHIE MAY L. MANANGKILA</div>
                                <div style="font-size:12px; color:#6b7280;">School Registrar</div>
                            </div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:#faf9f9; padding:22px 32px; border-top:1px solid #efefef;">
                            <div style="font-size:12px; color:#9ca3af; line-height:1.7;">
                                Vineyard International Polytechnic College<br>
                                Tel. Nos. (088) 856-8646 / (08822) 729-419 &middot; vipc_cdo07@yahoo.com.ph<br>
                                <span style="color:#c4c4c4;">This is an automated message — please do not reply to this email.</span>
                            </div>
                        </td>
                    </tr>
                </table>

                <div style="font-size:11px; color:#b3b3b3; margin-top:18px;">
                    &ldquo;We measure our success in terms of our graduates' gainful employment.&rdquo;
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
