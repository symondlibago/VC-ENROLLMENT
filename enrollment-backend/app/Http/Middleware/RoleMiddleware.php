<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    /**
     * `role:Cashier` still means exactly that; `role:Admin,Cashier` admits
     * either. Several desks legitimately share an endpoint — the historical
     * payment archive is worked by the cashier and the assistants helping
     * them — and the alternative was a second, near-identical middleware.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        if (!in_array($request->user()->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Required role: ' . implode(' or ', $roles)
            ], 403);
        }

        // `users` has no is_active column today, and an absent attribute reads
        // as null — which refused every account on every role-gated route.
        // Nothing had used `role:` yet, so it went unnoticed. Checked only
        // when the column exists, so adding one later enforces it again.
        if (array_key_exists('is_active', $request->user()->getAttributes())
            && !$request->user()->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is inactive'
            ], 403);
        }

        return $next($request);
    }
}

