<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps a narrow role inside the handful of endpoints it was hired for.
 *
 * Most of this API is gated on being signed in and nothing more, which is fine
 * for the desks that need the run of the system. It is not fine for an account
 * created for one task: hiding the other pages in the menu hides buttons, not
 * routes, and a signed-in browser can ask for anything.
 *
 * So for the roles named below the rule is inverted — everything is refused
 * except what is listed. A new confined role is a new entry in this map, not
 * an audit of two hundred routes, and a route added elsewhere in the system
 * is out of their reach by default rather than in it.
 */
class ConfineLimitedRoles
{
    /**
     * role => the only paths it may reach (Laravel `request->is()` patterns).
     *
     * The first few are what any signed-in account needs to exist at all:
     * know who it is, change its own password, and sign out.
     */
    private const CONFINED = [
        'Student Assistant' => [
            'api/user',
            'api/logout',
            'api/user/profile',
            'api/user/password',
            'api/user/pin',
            'api/user/profile/verify-email-change',
            // The work itself
            'api/historical-payments',
            'api/historical-payments/*',
            // Read-only, and only so the course box can suggest current codes
            'api/courses',
        ],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $allowed = self::CONFINED[$user->role] ?? null;

        // Not a confined role: the ordinary rules apply.
        if ($allowed === null) {
            return $next($request);
        }

        foreach ($allowed as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'This account does not have access to that part of the system.',
        ], 403);
    }
}
