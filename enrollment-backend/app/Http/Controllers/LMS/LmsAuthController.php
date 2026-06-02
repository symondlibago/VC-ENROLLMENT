<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class LmsAuthController extends Controller
{
    private const ALLOWED_ROLES = ['admin', 'instructor', 'student'];

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter a valid email and password.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        // Single, deliberately non-revealing message for both a non-existent
        // email and a wrong password (prevents user-enumeration).
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password. Please check your credentials and try again.',
            ], 401);
        }

        $normalizedRole = strtolower($user->role ?? '');
        if (!in_array($normalizedRole, self::ALLOWED_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not authorized for the LMS.',
            ], 403);
        }

        $token = $user->createToken('LMS-Access', ['lms-access'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'LMS login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'lms_role' => $normalizedRole,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'lms_role' => strtolower($user->role ?? ''),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json([
            'success' => true,
            'message' => 'Logged out from LMS',
        ]);
    }
}
