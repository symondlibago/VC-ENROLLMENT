<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsAssignment;
use App\Models\LMS\LmsModule;
use App\Models\LMS\LmsSubjectInstructor;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsNotifier;
use App\Models\LMS\LmsSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LmsAssignmentController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    private function assertCanManageModule(Request $request, LmsModule $module): void
    {
        $role = $this->role($request);
        if ($role === 'admin') return;
        if ($role === 'instructor') {
            if (!LmsInstructorScope::teaches($request->user()->id, $module->subject_id)) abort(403);
            return;
        }
        abort(403);
    }

    private function assertCanViewModule(Request $request, LmsModule $module): void
    {
        $role = $this->role($request);
        $user = $request->user();

        if ($role === 'admin') return;

        if ($role === 'instructor') {
            if (!LmsInstructorScope::teaches($user->id, $module->subject_id)) abort(403);
            return;
        }

        if ($role === 'student') {
            $enrolled = DB::table('student_subject')
                ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->where('student_subject.subject_id', $module->subject_id)
                ->exists();
            if (!$enrolled) abort(403);
            return;
        }
        abort(403);
    }

    public function indexByModule(Request $request, int $moduleId)
    {
        $module = LmsModule::findOrFail($moduleId);
        $this->assertCanViewModule($request, $module);

        $assignments = LmsAssignment::where('module_id', $moduleId)
            ->with('creator:id,name')
            ->orderBy('id')
            ->get();

        if ($this->role($request) === 'student') {
            $userId = $request->user()->id;
            $assignments->each(function ($a) use ($userId) {
                $sub = LmsSubmission::where('assignment_id', $a->id)
                    ->where('student_user_id', $userId)
                    ->latest('submitted_at')
                    ->first();

                if ($sub) {
                    $late = LmsSubmission::computeLate($a->due_at, $sub->submitted_at);
                    $sub->is_late = $late['is_late'];
                    $sub->days_late = $late['days_late'];
                }

                $a->my_submission = $sub;
            });
        }

        return response()->json(['success' => true, 'data' => $assignments]);
    }

    public function show(Request $request, int $id)
    {
        $assignment = LmsAssignment::with('module', 'creator:id,name')->findOrFail($id);
        $this->assertCanViewModule($request, $assignment->module);
        return response()->json(['success' => true, 'data' => $assignment]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'module_id' => 'required|integer|exists:lms_modules,id',
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string',
            'due_at' => 'nullable|date',
            'allow_late' => 'nullable|boolean',
            'max_score' => 'nullable|integer|min:1|max:1000',
            'is_published' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $module = LmsModule::findOrFail($request->module_id);
        $this->assertCanManageModule($request, $module);

        $assignment = LmsAssignment::create([
            'module_id' => $module->id,
            'created_by' => $request->user()->id,
            'title' => $request->title,
            'instructions' => $request->instructions,
            'due_at' => $request->due_at,
            'allow_late' => $request->boolean('allow_late', false),
            'max_score' => $request->max_score ?? 100,
            'is_published' => $request->boolean('is_published', true),
        ]);

        if ($assignment->is_published) {
            try {
                LmsNotifier::sendToSubjectStudents(
                    (int) $module->subject_id,
                    'assignment_created',
                    'New assignment: ' . $assignment->title,
                    $module->title ? ('In module: ' . $module->title) : null,
                    $module->section_id ? (int) $module->section_id : null,
                    '/lms/subjects/' . $module->subject_id,
                    ['assignment_id' => $assignment->id, 'module_id' => $module->id]
                );
            } catch (\Throwable $e) {
                // Never let a notification failure block assignment creation.
            }
        }

        return response()->json(['success' => true, 'data' => $assignment], 201);
    }

    public function update(Request $request, int $id)
    {
        $assignment = LmsAssignment::with('module')->findOrFail($id);
        $this->assertCanManageModule($request, $assignment->module);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'instructions' => 'nullable|string',
            'due_at' => 'nullable|date',
            'allow_late' => 'nullable|boolean',
            'max_score' => 'nullable|integer|min:1|max:1000',
            'is_published' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $assignment->fill($request->only(['title', 'instructions', 'due_at', 'allow_late', 'max_score', 'is_published']));
        $assignment->save();

        return response()->json(['success' => true, 'data' => $assignment]);
    }

    public function destroy(Request $request, int $id)
    {
        $assignment = LmsAssignment::with('module')->findOrFail($id);
        $this->assertCanManageModule($request, $assignment->module);
        $assignment->delete();
        return response()->json(['success' => true, 'message' => 'Assignment deleted.']);
    }
}
