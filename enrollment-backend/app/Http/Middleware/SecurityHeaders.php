<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = [
            // Stop browsers from MIME-sniffing responses into another type
            // (important for the user-uploaded files we stream back).
            'X-Content-Type-Options' => 'nosniff',
            // Disallow embedding API responses in a frame (anti-clickjacking).
            'X-Frame-Options' => 'DENY',
            // Don't leak full URLs/tokens in the Referer header cross-origin.
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            // Disable the legacy XSS auditor (modern, OWASP-recommended value).
            'X-XSS-Protection' => '0',
            // Block Adobe cross-domain policy file abuse.
            'X-Permitted-Cross-Domain-Policies' => 'none',
        ];

        foreach ($headers as $key => $value) {
            // Don't clobber a header a controller deliberately set.
            if (!$response->headers->has($key)) {
                $response->headers->set($key, $value);
            }
        }

        return $response;
    }
}
