@php
    // $red and $green arrive from the emails.* view composer, which puts them
    // in scope for the sections below as well as for this file.

    // The 112px copy, not the 480px original: a full-size logo embeds about
    // 415 KB of base64 into every message. Falls back if it is ever missing.
    $logo = file_exists(public_path('circlelogo-email.png'))
        ? public_path('circlelogo-email.png')
        : public_path('circlelogo.png');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Vineyard International Polytechnic College')</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Segoe UI', Helvetica, Arial, sans-serif; color:#1f2937;">
    {{-- The one line that shows in the inbox list before it is opened --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; height:0; width:0;">
        @yield('preheader')
    </div>

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
                                            @yield('department') &middot; Cagayan de Oro City
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @yield('content')

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:#faf9f9; padding:22px 32px; border-top:1px solid #efefef;">
                            <div style="font-size:12px; color:#9ca3af; line-height:1.7;">
                                Vineyard International Polytechnic College<br>
                                Antonio Luna Street, Mabulay Subdivision, Cagayan de Oro City<br>
                                Tel. Nos. (088) 856-8646 / (08822) 729-419 &middot; vipc_cdo07@yahoo.com.ph<br>
                                <span style="color:#c4c4c4;">This is an automated message &mdash; please do not reply to this email.</span>
                            </div>
                        </td>
                    </tr>
                </table>

                <div style="font-size:11px; color:#b3b3b3; margin-top:18px;">
                    &ldquo;We measure our success in terms of our graduates&rsquo; gainful employment.&rdquo;
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
