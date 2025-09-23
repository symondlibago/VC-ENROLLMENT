<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
{
    $sections = Section::with('course', 'students')->orderBy('created_at', 'desc')->get();
    return response()->json(['success' => true, 'data' => $sections]);
}

    public function show(Section $section)
    {
        try {
            $section->load('course', 'students');
            return response()->json(['success' => true, 'data' => $section]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to retrieve section details'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'course_id' => 'required|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $section = Section::create($validator->validated());
        $section->load('course')->loadCount('students'); // Load relations for the response

        return response()->json(['success' => true, 'message' => 'Section created successfully', 'data' => $section], 201);
    }

    /**
     * Add an array of students to a specific section.
     */
    public function addStudents(Request $request, Section $section)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:pre_enrolled_students,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // syncWithoutDetaching prevents duplicate entries and doesn't remove existing ones
        $section->students()->syncWithoutDetaching($request->student_ids);

        // Load the updated student list for the response
        $section->load('students');

        return response()->json(['success' => true, 'message' => 'Students added successfully', 'data' => $section]);
    }

    // You can add show, update, and destroy methods here as needed
}