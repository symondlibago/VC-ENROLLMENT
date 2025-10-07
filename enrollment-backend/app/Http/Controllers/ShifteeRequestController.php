<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Program;
use App\Models\PreEnrolledStudent;
use App\Models\ShifteeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShifteeRequestController extends Controller
{
    /**
     * Get data needed for the shifting page (all programs and courses).
     */
    public function getShiftingData()
    {
        $programs = Program::orderBy('program_name')->get();
        $courses = Course::orderBy('course_name')->get();
        return response()->json([
            'success' => true,
            'data' => [
                'programs' => $programs,
                'courses' => $courses
            ]
        ]);
    }

    /**
     * Display a listing of all shiftee requests.
     * This powers the table at the bottom of the page.
     */
    public function index()
    {
        $requests = ShifteeRequest::with(['student', 'previousCourse', 'newCourse'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * Store a newly created shiftee request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:pre_enrolled_students,id',
            'new_course_id' => 'required|exists:courses,id',
        ]);

        $student = PreEnrolledStudent::findOrFail($validated['student_id']);

        // Prevent creating duplicate pending requests
        $existing = ShifteeRequest::where('pre_enrolled_student_id', $student->id)
                                    ->where('status', 'pending_program_head')->exists();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'This student already has a pending shiftee request.'], 422);
        }

        try {
            $requestModel = ShifteeRequest::create([
                'pre_enrolled_student_id' => $student->id,
                'previous_course_id' => $student->course_id,
                'new_course_id' => $validated['new_course_id'],
            ]);
            return response()->json(['success' => true, 'message' => 'Request submitted successfully!', 'data' => $requestModel], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Request failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified request.
     * This provides the data for the modal pop-up.
     */
    public function show($id)
    {
        $request = ShifteeRequest::with(['student', 'previousCourse', 'newCourse'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $request]);
    }
    
    /**
     * Process the approval or rejection of a request.
     */
    public function processRequest(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        // Ensure user is a Program Head or Admin
        if (!in_array($user->role, ['Program Head', 'Admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $shifteeRequest = ShifteeRequest::findOrFail($id);
        
        if ($shifteeRequest->status !== 'pending_program_head') {
            return response()->json(['success' => false, 'message' => 'This request has already been processed.'], 422);
        }

        DB::beginTransaction();
        try {
            $shifteeRequest->status = $validated['status'];
            $shifteeRequest->processed_by = $user->id;
            if ($validated['status'] === 'rejected') {
                $shifteeRequest->rejection_remarks = $validated['remarks'];
            }
            $shifteeRequest->save();

            // If approved, update the student's actual course AND academic status
            if ($validated['status'] === 'approved') {
                $student = PreEnrolledStudent::findOrFail($shifteeRequest->pre_enrolled_student_id);
                $student->course_id = $shifteeRequest->new_course_id;
                
                // Automatically set the student's status to Irregular
                $student->academic_status = 'Irregular';

                $student->save();
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Request processed successfully.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to process request.', 'error' => $e->getMessage()], 500);
        }
    }
}