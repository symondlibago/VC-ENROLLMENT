<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $instructors = Instructor::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $instructors]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email', // Check uniqueness in users table
            'password' => 'required|string|min:8|confirmed', // Add password validation
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $instructor = DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => 'instructor',
                ]);

                $instructorData = $request->except(['password', 'password_confirmation']);
                $instructor = $user->instructor()->create($instructorData);

                return $instructor;
            });

             return response()->json(['success' => true, 'message' => 'Instructor created successfully', 'data' => $instructor], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to create instructor.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        $instructor->load('user'); 
        return response()->json(['success' => true, 'data' => $instructor]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Instructor $instructor)
    {
        $user = $instructor->user; // Get the associated user

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::transaction(function () use ($request, $instructor, $user) {
                $user->update([
                    'name' => $request->name,
                    'email' => $request->email,
                ]);
                $instructor->update($request->all());
            });

            return response()->json(['success' => true, 'message' => 'Instructor updated successfully', 'data' => $instructor->fresh()]);

        } catch (\Exception $e) {
             return response()->json(['success' => false, 'message' => 'Failed to update instructor.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        $user = $instructor->user;

        if ($user) {
            $user->delete();
            return response()->json(['success' => true, 'message' => 'Instructor and associated user deleted successfully']);
        }
        
        $instructor->delete();
        return response()->json(['success' => true, 'message' => 'Instructor deleted successfully']);
    }
}