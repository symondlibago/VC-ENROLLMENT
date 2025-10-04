<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * Display a listing of the courses.
     */
    public function index(): JsonResponse
    {
        try {
            $courses = Course::with('program')->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Courses retrieved successfully',
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created course in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'course_code' => 'required|string|max:255',
                'course_name' => 'required|string|max:255',
                'course_specialization' => 'nullable|string|max:255',
                'description' => 'required|string',
                'years' => 'required|integer|min:1|max:10',
                'program_id' => 'required|integer|exists:programs,id'
            ]);

            $course = Course::create($validated);
            $course->load('program');

            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $course
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified course.
     */
    public function show(Course $course): JsonResponse
    {
        try {
            $course->load('program');
            
            return response()->json([
                'success' => true,
                'message' => 'Course retrieved successfully',
                'data' => $course
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified course in storage.
     */
    public function update(Request $request, Course $course): JsonResponse
    {
        try {
            $validated = $request->validate([
                'course_code' => 'required|string|max:255',
                'course_name' => 'required|string|max:255',
                'course_specialization' => 'nullable|string|max:255',
                'description' => 'required|string',
                'years' => 'required|integer|min:1|max:10',
                'program_id' => 'required|integer|exists:programs,id'
            ]);

            $course->update($validated);
            $course->load('program');

            return response()->json([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $course->fresh(['program'])
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified course from storage.
     */
    public function destroy(Course $course): JsonResponse
    {
        try {
            $course->delete();

            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

