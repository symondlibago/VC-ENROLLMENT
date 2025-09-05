<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ProgramController extends Controller
{
    /**
     * Display a listing of the programs.
     */
    public function index(): JsonResponse
    {
        try {
            $programs = Program::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Programs retrieved successfully',
                'data' => $programs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created program in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'program_name' => 'required|string|max:255',
                'description' => 'required|string',
                'years' => 'required|integer|min:1|max:10'
            ]);

            $program = Program::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Program created successfully',
                'data' => $program
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
                'message' => 'Failed to create program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified program.
     */
    public function show(Program $program): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Program retrieved successfully',
                'data' => $program
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified program in storage.
     */
    public function update(Request $request, Program $program): JsonResponse
    {
        try {
            $validated = $request->validate([
                'program_name' => 'required|string|max:255',
                'description' => 'required|string',
                'years' => 'required|integer|min:1|max:10'
            ]);

            $program->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Program updated successfully',
                'data' => $program->fresh()
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
                'message' => 'Failed to update program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified program from storage.
     */
    public function destroy(Program $program): JsonResponse
    {
        try {
            $program->delete();

            return response()->json([
                'success' => true,
                'message' => 'Program deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete program',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

