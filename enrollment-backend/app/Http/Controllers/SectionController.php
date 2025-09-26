<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\PreEnrolledStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SectionController extends Controller
{

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
        $section->load('course', 'students');

        return response()->json(['success' => true, 'message' => 'Section created successfully', 'data' => $section], 201);
    }

    public function addStudents(Request $request, Section $section)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:pre_enrolled_students,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $section->students()->syncWithoutDetaching($request->student_ids);
        
        $section->load('course', 'students');

        return response()->json(['success' => true, 'message' => 'Students added successfully', 'data' => $section]);
    }

    public function removeStudent(Section $section, PreEnrolledStudent $student)
    {
        try {
            $section->students()->detach($student->id);
            
            $section->load('course', 'students');
            
            return response()->json([
                'success' => true, 
                'message' => 'Student removed from section successfully.', 
                'data' => $section
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Failed to remove student from section.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
