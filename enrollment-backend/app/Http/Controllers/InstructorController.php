<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
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
        $instructors = Instructor::orderBy('created_at', 'desc')->get();
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
            'email' => 'required|email|unique:instructors,email',
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $instructor = Instructor::create($validator->validated());

        return response()->json(['success' => true, 'message' => 'Instructor created successfully', 'data' => $instructor], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Instructor $instructor)
    {
        return response()->json(['success' => true, 'data' => $instructor]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Instructor $instructor)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('instructors')->ignore($instructor->id)],
            'status' => ['required', Rule::in(['Active', 'On Leave', 'Retired'])],
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $instructor->update($validator->validated());

        return response()->json(['success' => true, 'message' => 'Instructor updated successfully', 'data' => $instructor]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Instructor $instructor)
    {
        $instructor->delete();
        return response()->json(['success' => true, 'message' => 'Instructor deleted successfully']);
    }
}