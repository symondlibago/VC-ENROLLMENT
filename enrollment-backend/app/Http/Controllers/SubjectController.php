<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class SubjectController extends Controller
{

    public function search(Request $request): JsonResponse
    {
        $searchTerm = $request->query('q', '');
        $courseId = $request->query('course_id');

        if (strlen($searchTerm) < 2) {
            return response()->json(['data' => []]); // Don't search for very short terms
        }
        
        // Active only: this feeds pickers — prerequisites and the like — and
        // a retired subject must not become something new depends on.
        $query = Subject::active()
            ->where(function ($q) use ($searchTerm) {
                $q->where('subject_code', 'like', "%{$searchTerm}%")
                  ->orWhere('descriptive_title', 'like', "%{$searchTerm}%");
            })
            ->select('id', 'subject_code', 'descriptive_title', 'archived_at');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        $subjects = $query->limit(10)->get();

        return response()->json(['data' => $subjects]);
    }

    public function getEnrolledStudents($id) {
        // Load the subject with students and their associated course
        $subject = Subject::with(['students.course'])->findOrFail($id); 
        
        return response()->json([
            'success' => true,
            'data' => $subject->students->map(function($student) {
                return [
                    'id'         => $student->id,
                    'student_id' => $student->student_id_number, // Matches frontend student.student_id
                    'name'       => $student->full_name,        // Uses the accessor from PreEnrolledStudent.php
                    'course'     => $student->course->course_code ?? 'N/A',
                    'year'       => $student->year,
                    'section'    => $student->sections->pluck('name')->implode(', ') ?: 'Unassigned'
                ];
            })
        ]);
    }

    /**
     * Display a listing of the subjects.
     */
    public function index(): JsonResponse
    {
        try {
            $subjects = Subject::with(['course', 'prerequisite:id,subject_code'])->orderBy('created_at', 'desc')->get();
            
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
    public function getByCourse(Request $request, Course $course): JsonResponse
    {
        try {
            // Start querying subjects for the given course
            $query = $course->subjects()->with('prerequisite:id,subject_code');

            // Archived subjects are left out unless the caller is the screen
            // that manages the curriculum itself. Excluding by default is what
            // keeps a retired subject out of every enrolment picker at once,
            // including any added later.
            if (!$request->boolean('include_archived')) {
                $query->active();
            }

            if ($request->has('year') && $request->year) {
                $query->where('year', $request->year);
            }

            if ($request->has('semester') && $request->semester) {
                $query->where('semester', $request->semester);
            }

            // Get the results
            $subjects = $query->orderBy('year')->orderBy('semester')->get();
            
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
                'prerequisite_id' => 'nullable|integer|exists:subjects,id',
                'year' => 'required|string|in:Grade 11,Grade 12,1st Year,2nd Year,3rd Year,4th Year,1st Year Summer,2nd Year Summer,3rd Year Summer,4th Year Summer',
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
                'prerequisite_id' => 'nullable|integer|exists:subjects,id',
                'year' => 'nullable|string|in:Grade 11,Grade 12,1st Year,2nd Year,3rd Year,4th Year,1st Year Summer,2nd Year Summer,3rd Year Summer,4th Year Summer',
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
            // Deleting cascades, permanently, through every grade, enrolment,
            // INC record, schedule and add/drop item that names this subject.
            // A subject anyone has touched is archived instead, never deleted.
            $gradeCount = $subject->grades()->count();
            $studentCount = $subject->students()->count();

            if ($gradeCount > 0 || $studentCount > 0) {
                $held = array_filter([
                    $gradeCount > 0 ? "{$gradeCount} grade" . ($gradeCount === 1 ? '' : 's') : null,
                    $studentCount > 0 ? "{$studentCount} enrolled student" . ($studentCount === 1 ? '' : 's') : null,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "{$subject->subject_code} has " . implode(' and ', $held)
                        . ' on record. Deleting it would erase them. Archive it instead to take it'
                        . ' out of the curriculum while keeping every record intact.',
                    'blocked_by' => [
                        'grades' => $gradeCount,
                        'students' => $studentCount,
                    ],
                ], 409);
            }

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

    /**
     * Retire a subject from the curriculum, keeping everything attached to it.
     */
    public function archive(Request $request, Subject $subject): JsonResponse
    {
        try {
            if (!$subject->archive($request->user()?->id)) {
                return response()->json([
                    'success' => false,
                    'message' => "{$subject->subject_code} is already archived.",
                ], 409);
            }

            $subject->load(['course', 'prerequisite:id,subject_code', 'archivedBy:id,name']);

            return response()->json([
                'success' => true,
                'message' => "{$subject->subject_code} archived. It will no longer be offered for enrollment.",
                'data' => $subject,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive subject',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Put an archived subject back into the curriculum.
     */
    public function restore(Subject $subject): JsonResponse
    {
        try {
            if (!$subject->restore()) {
                return response()->json([
                    'success' => false,
                    'message' => "{$subject->subject_code} is not archived.",
                ], 409);
            }

            $subject->load(['course', 'prerequisite:id,subject_code']);

            return response()->json([
                'success' => true,
                'message' => "{$subject->subject_code} restored. It can be offered for enrollment again.",
                'data' => $subject,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore subject',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}