<?php

namespace App\Http\Controllers;

use App\Models\GradingPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ManagementController extends Controller
{
    /**
     * Fetch all grading periods.
     */
    public function getGradingPeriods()
    {
        $periods = GradingPeriod::all()->keyBy('name');
        return response()->json(['success' => true, 'data' => $periods]);
    }

    /**
     * Update the start and end dates for grading periods.
     */
    public function updateGradingPeriods(Request $request)
    {
        $validator = Validator::make($request->all(), [
            '*.start_date' => 'nullable|date',
            '*.end_date' => 'nullable|date|after_or_equal:*.start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $periodsData = $request->all();

        try {
            DB::transaction(function () use ($periodsData) {
                foreach ($periodsData as $name => $dates) {
                    GradingPeriod::where('name', $name)->update([
                        'start_date' => $dates['start_date'] ?? null,
                        'end_date' => $dates['end_date'] ?? null,
                    ]);
                }
            });

            return response()->json(['success' => true, 'message' => 'Grading periods updated successfully.']);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'An error occurred while updating.', 'error' => $e->getMessage()], 500);
        }
    }
}
