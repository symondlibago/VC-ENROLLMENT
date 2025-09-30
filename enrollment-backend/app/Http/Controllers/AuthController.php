<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('EduEnroll')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation errors', 'errors' => $validator->errors()], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();

        // --- ENHANCEMENT: Check for secondary PIN ---
        if ($user->secondary_pin) {
            // User has a PIN, so we start the 2FA process.
            // Create a secure, temporary token that expires in 2 minutes.
            $payload = json_encode(['user_id' => $user->id, 'exp' => now()->addMinutes(2)->timestamp]);
            $tempToken = Crypt::encryptString($payload);

            return response()->json([
                'success' => true,
                'message' => 'Secondary authentication required.',
                'data' => [
                    'requires_2fa' => true,
                    'temp_token' => $tempToken,
                ]
            ]);
        }

        // If no PIN, log in directly.
        $token = $user->createToken('EduEnroll')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    public function verifyPin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|digits:6',
            'temp_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Invalid data provided.'], 422);
        }

        try {
            $payload = json_decode(Crypt::decryptString($request->temp_token), true);

            // Check if the temporary token has expired
            if (now()->timestamp > $payload['exp']) {
                return response()->json(['success' => false, 'message' => 'Verification code expired. Please log in again.'], 401);
            }

            $user = User::find($payload['user_id']);

            if (!$user || !Hash::check($request->pin, $user->secondary_pin)) {
                return response()->json(['success' => false, 'message' => 'The PIN provided is incorrect.'], 401);
            }

            // PIN is correct, generate the final auth token
            $token = $user->createToken('EduEnroll')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ]);

        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            return response()->json(['success' => false, 'message' => 'Invalid session. Please log in again.'], 401);
        }
    }

     /**
     * --- NEW: Set or Update the secondary PIN ---
     */
    public function updatePin(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_pin' => 'required|string|digits:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // Verify user's main password before changing PIN
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Your current password does not match.'], 422);
        }

        $user->secondary_pin = Hash::make($request->new_pin);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Secondary PIN has been updated successfully.'
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user()
            ]
        ]);
    }

    /**
     * Reset password (send reset link)
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // In a real application, you would send an email with a reset link
        // For this demo, we'll just return a success message
        return response()->json([
            'success' => true,
            'message' => 'Password reset link sent to your email'
        ]);
    }

     /**
     * --- NEW: Update user profile ---
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user->update($request->only('name', 'email'));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully!',
            'data' => ['user' => $user]
        ]);
    }

    /**
     * --- NEW: Change user password ---
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password does not match.'
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
}
