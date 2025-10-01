<?php
namespace App\Http\Controllers;

use App\Models\PreEnrolledStudent;
use App\Models\Subject;
use App\Models\SubjectChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SubjectChangeRequestController extends Controller {
    // 1. Search for students (for the search bar)
    public function searchStudents(Request $request) {
        $query = PreEnrolledStudent::with('course')
            ->where('enrollment_status', 'enrolled');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_id_number', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        $students = $query->take(10)->get();
        return response()->json(['success' => true, 'data' => $students]);
    }

    // 2. Get details for a selected student (enrolled & available subjects)
    public function getStudentSubjectDetails($studentId) // Remove Request $request
    {
        $student = PreEnrolledStudent::findOrFail($studentId);
        
        // This remains the same, gets all enrolled subjects
        $enrolledSubjects = $student->subjects()->get();
        $enrolledSubjectIds = $enrolledSubjects->pluck('id');

        // This part changes: remove the query filters to get ALL available subjects
        $availableSubjects = Subject::where('course_id', $student->course_id)
                                          ->whereNotIn('id', $enrolledSubjectIds)
                                          ->orderBy('year')
                                          ->orderBy('semester')
                                          ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'enrolled' => $enrolledSubjects,
                'available' => $availableSubjects
            ]
        ]);
    }

    // 3. Store a new subject change request
    public function store(Request $request) {
        $validated = $request->validate([
            'student_id' => 'required|exists:pre_enrolled_students,id',
            'subjects_to_add' => 'nullable|array',
            'subjects_to_add.*' => 'exists:subjects,id',
            'subjects_to_drop' => 'nullable|array',
            'subjects_to_drop.*' => 'exists:subjects,id',
        ]);
        
        try {
            DB::beginTransaction();
            $requestModel = SubjectChangeRequest::create([
                'pre_enrolled_student_id' => $validated['student_id']
            ]);

            foreach ($validated['subjects_to_add'] ?? [] as $subjectId) {
                $requestModel->items()->create(['subject_id' => $subjectId, 'action' => 'add']);
            }
            foreach ($validated['subjects_to_drop'] ?? [] as $subjectId) {
                $requestModel->items()->create(['subject_id' => $subjectId, 'action' => 'drop']);
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Request submitted successfully.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Request failed.', 'error' => $e->getMessage()], 500);
        }
    }

    // 4. List all change requests (for Section 2)
    public function index() {
        $requests = SubjectChangeRequest::with('student')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $requests]);
    }

    // 5. Show details of a single request (for the modal)
    public function show($id) {
        $request = SubjectChangeRequest::with(['student', 'items.subject'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $request]);
    }
    
    // 6. Process approval/rejection
    public function processRequest(Request $request, $id) {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        // Eager load the student relationship to perform the shiftee check efficiently
        $changeRequest = SubjectChangeRequest::with('student')->findOrFail($id);
        $user = Auth::user();
        $newStatus = null;

        // Approval Logic
        if ($validated['status'] === 'approved') {
            if ($user->role === 'Program Head' && $changeRequest->status === 'pending_program_head') {
                $changeRequest->processed_by_program_head = $user->id;

                // Check if the student is a shiftee. If so, approve directly.
                if ($changeRequest->student->isShiftee()) {
                    $newStatus = 'approved'; // Shiftee request is auto-approved after Program Head
                } else {
                    $newStatus = 'pending_cashier'; // Non-shiftee goes to Cashier for next step
                }

            } elseif ($user->role === 'Cashier' && $changeRequest->status === 'pending_cashier') {
                $changeRequest->processed_by_cashier = $user->id;
                $newStatus = 'approved';
            }
        } else { // Rejection Logic
            $newStatus = 'rejected';
            $changeRequest->rejection_remarks = $validated['remarks'];
        }

        if ($newStatus) {
            $changeRequest->status = $newStatus;
            $changeRequest->save();

            // If finally approved, apply the changes to the student_subject table
            if ($newStatus === 'approved') {
                $this->applySubjectChanges($changeRequest);
            }
            return response()->json(['success' => true, 'message' => 'Request processed successfully.']);
        }
        
        return response()->json(['success' => false, 'message' => 'Unauthorized or invalid state.'], 403);
    }

    private function applySubjectChanges(SubjectChangeRequest $changeRequest) {
        $student = $changeRequest->student;
        $items = $changeRequest->items;

        $subjectsToAdd = $items->where('action', 'add')->pluck('subject_id');
        $subjectsToDrop = $items->where('action', 'drop')->pluck('subject_id');

        $student->subjects()->attach($subjectsToAdd);
        $student->subjects()->detach($subjectsToDrop);
    }
}