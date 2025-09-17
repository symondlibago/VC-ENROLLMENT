<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class SubjectController extends Controller
{
    /**
     * Display a listing of the subjects.
     */
    public function index(): JsonResponse
    {
        try {
            $subjects = Subject::with('course')->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Subjects retrieved successfully',
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects by course ID.
     */
    public function getByCourse(Course $course): JsonResponse
    {
        try {
            $subjects = $course->subjects()->orderBy('year')->orderBy('semester')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Subjects retrieved successfully',
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created subject in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'subject_code' => 'required|string|max:255',
                'descriptive_title' => 'required|string|max:255',
                'lec_hrs' => 'nullable|numeric|min:0',
                'lab_hrs' => 'nullable|numeric|min:0',
                'total_units' => 'nullable|numeric|min:0',
                'number_of_hours' => 'nullable|numeric|min:0',
                'pre_req' => 'nullable|string|max:255',
                'year' => 'required|string|in:Grade 11,Grade 12,1st Year,2nd Year,3rd Year,4th Year,1st Year Summer,2nd Year Summer',
                'semester' => 'required|string|in:1st Semester,2nd Semester',
                'course_id' => 'required|integer|exists:courses,id'
            ]);

            $subject = Subject::create($validated);
            $subject->load('course');

            return response()->json([
                'success' => true,
                'message' => 'Subject created successfully',
                'data' => $subject
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
                'message' => 'Failed to create subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified subject.
     */
    public function show(Subject $subject): JsonResponse
    {
        try {
            $subject->load('course');
            
            return response()->json([
                'success' => true,
                'message' => 'Subject retrieved successfully',
                'data' => $subject
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified subject in storage.
     */
    public function update(Request $request, Subject $subject): JsonResponse
    {
        try {
            $validated = $request->validate([
                'subject_code' => 'required|string|max:255',
                'descriptive_title' => 'required|string|max:255',
                'lec_hrs' => 'nullable|numeric|min:0',
                'lab_hrs' => 'nullable|numeric|min:0',
                'total_units' => 'nullable|numeric|min:0',
                'number_of_hours' => 'nullable|numeric|min:0',
                'pre_req' => 'nullable|string|max:255',
                'year' => 'nullable|string|in:1st Year,2nd Year,3rd Year,4th Year,1st Year Summer,2nd Year Summer',
                'semester' => 'required|string|in:1st Semester,2nd Semester',
                'course_id' => 'required|integer|exists:courses,id'
            ]);

            $subject->update($validated);
            $subject->load('course');

            return response()->json([
                'success' => true,
                'message' => 'Subject updated successfully',
                'data' => $subject->fresh(['course'])
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
                'message' => 'Failed to update subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified subject from storage.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        try {
            $subject->delete();

            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}