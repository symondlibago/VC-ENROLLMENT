<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    /**
     * Get all schedules for a specific subject.
     *
     * @param  int  $subjectId
     * @return \Illuminate\Http\Response
     */
    public function getBySubject($subjectId)
    {
        try {
            $subject = Subject::findOrFail($subjectId);
            $schedules = $subject->schedules;
            
            return response()->json([
                'status' => 'success',
                'data' => $schedules
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve schedules: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific schedule.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $schedule = Schedule::findOrFail($id);
            
            return response()->json([
                'status' => 'success',
                'data' => $schedule
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Schedule not found: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Store a newly created schedule.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'day' => 'nullable|string',
                'time' => 'nullable|string',
                'room_no' => 'nullable|string',
                'instructor' => 'nullable|string',
                'subject_id' => 'required|exists:subjects,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $schedule = Schedule::create($request->all());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Schedule created successfully',
                'data' => $schedule
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create schedule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified schedule.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $schedule = Schedule::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'day' => 'nullable|string',
                'time' => 'nullable|string',
                'room_no' => 'nullable|string',
                'instructor' => 'nullable|string',
                'subject_id' => 'exists:subjects,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $schedule->update($request->all());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Schedule updated successfully',
                'data' => $schedule
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update schedule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified schedule.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $schedule = Schedule::findOrFail($id);
            $schedule->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Schedule deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete schedule: ' . $e->getMessage()
            ], 500);
        }
    }
}