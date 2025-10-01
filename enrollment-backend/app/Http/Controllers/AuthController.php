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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmailUpdateOtpMail;
use App\Mail\ForgotPasswordOtpMail;

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
     * MODIFIED: Update the secondary PIN
     */
    public function updatePin(Request $request)
    {
        $user = $request->user();
        $userHasPin = $user->has_pin;

        // CORRECTED: 'current_pin' is only required if the user already has one.
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'current_pin'      => [Rule::requiredIf($userHasPin), 'nullable', 'string', 'digits:6'],
            'new_pin'          => 'required|string|digits:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // CORRECTED: Always check the password first.
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'The password you entered is incorrect.'], 422);
        }

        // CORRECTED: Only check the current_pin if the user already has one set.
        if ($userHasPin && !Hash::check($request->current_pin, $user->secondary_pin)) {
            return response()->json(['success' => false, 'message' => 'The current PIN you entered is incorrect.'], 422);
        }

        $user->secondary_pin = Hash::make($request->new_pin);
        $user->save();

        $message = $userHasPin ? 'Secondary PIN has been updated successfully.' : 'Secondary PIN has been set successfully.';
        return response()->json(['success' => true, 'message' => $message]);
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
     * MODIFIED: Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'current_password' => 'required|string',
            'secondary_pin' => 'required|string|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Your current password does not match.'], 422);
        }

        if (!$user->secondary_pin || !Hash::check($request->secondary_pin, $user->secondary_pin)) {
            return response()->json(['success' => false, 'message' => 'The 6-digit PIN is incorrect.'], 422);
        }

        if ($request->email !== $user->email) {
            $otp = random_int(100000, 999999);
            Mail::to($request->email)->send(new EmailUpdateOtpMail($otp));
            
            // --- NEW: Added a try-catch block to find the error ---
            try {
                Cache::put('email_update_for_user_' . $user->id, [
                    'otp' => $otp,
                    'new_email' => $request->email
                ], now()->addMinutes(10));
            } catch (\Exception $e) {
                // If caching fails, return a specific error message.
                return response()->json([
                    'success' => false,
                    'message' => 'Server error after sending email. Please check cache permissions. Details: ' . $e->getMessage()
                ], 500);
            }
            
            if ($request->name !== $user->name) {
                $user->update(['name' => $request->name]);
            }

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to new email for verification.',
                'otp_required' => true
            ]);
        }

        $user->update(['name' => $request->name]);

        return response()->json(['success' => true, 'message' => 'Profile updated successfully!', 'data' => ['user' => $user]]);
    }

    /**
     * NEW: Verify the OTP and finalize the email change
     */

    public function verifyEmailChange(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Invalid OTP format.', 'errors' => $validator->errors()], 422);
        }

        $cacheKey = 'email_update_for_user_' . $user->id;
        $cachedData = Cache::get($cacheKey);

        if (!$cachedData) {
            return response()->json(['success' => false, 'message' => 'Verification has expired. Please try again.'], 422);
        }

        if ($cachedData['otp'] != $request->otp) {
            return response()->json(['success' => false, 'message' => 'The OTP you entered is incorrect.'], 422);
        }

        // OTP is correct, update the user's email
        $user->email = $cachedData['new_email'];
        $user->email_verified_at = null; // Mark new email as unverified
        $user->save();

        // Clean up the cache
        Cache::forget($cacheKey);

        return response()->json(['success' => true, 'message' => 'Email address updated successfully!', 'data' => ['user' => $user]]);
    }

    /**
     * MODIFIED: Change user password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        // MODIFIED: Validator now requires the current PIN for verification
        $validator = Validator::make($request->all(), [
            'current_pin' => 'required|string|digits:6',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // MODIFIED: Verify user's current PIN
        if (!$user->secondary_pin || !Hash::check($request->current_pin, $user->secondary_pin)) {
            return response()->json(['success' => false, 'message' => 'The current PIN you entered is incorrect.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['success' => true, 'message' => 'Password changed successfully.']);
    }

     /**
     * NEW: Sends a password reset OTP to the user's email and stores it in the cache.
     */
    public function sendPasswordResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation errors', 'errors' => $validator->errors()], 422);
        }

        $otp = random_int(100000, 999999);
        $email = $request->email;

        // Store the OTP in the cache, keyed by the email, for 10 minutes
        Cache::put('password_reset_' . $email, $otp, now()->addMinutes(10));

        // Send the plain OTP to the user's email
        Mail::to($email)->send(new ForgotPasswordOtpMail($otp));

        return response()->json(['success' => true, 'message' => 'An OTP has been sent to your email address.']);
    }

    /**
     * NEW: Verifies the OTP from the cache and resets the password.
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation errors', 'errors' => $validator->errors()], 422);
        }
        
        $cacheKey = 'password_reset_' . $request->email;
        $cachedOtp = Cache::get($cacheKey);

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return response()->json(['success' => false, 'message' => 'The OTP is invalid or has expired.'], 422);
        }

        // OTP is correct, update the password and clear the OTP from the cache
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        Cache::forget($cacheKey);

        return response()->json(['success' => true, 'message' => 'Your password has been reset successfully.']);
    }
}
