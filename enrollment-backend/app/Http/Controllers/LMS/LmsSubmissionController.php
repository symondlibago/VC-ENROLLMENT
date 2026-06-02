<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\User;
use App\Models\LMS\LmsAssignment;
use App\Models\LMS\LmsSubjectInstructor;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsNotifier;
use App\Models\LMS\LmsSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LmsSubmissionController extends Controller
{
    private const DISK = 'r2';
    private const MAX_BYTES = 20 * 1024 * 1024;
    private const ALLOWED_EXT = ['pdf', 'docx', 'doc'];
    private const ALLOWED_MIME = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    private function assertStudentEnrolledInSubject(int $userId, int $subjectId): void
    {
        $enrolled = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('pre_enrolled_students.user_id', $userId)
            ->where('student_subject.subject_id', $subjectId)
            ->exists();
        if (!$enrolled) abort(403, 'You are not enrolled in this subject.');
    }

    private function assertInstructorAssigned(int $userId, int $subjectId): void
    {
        if (!LmsInstructorScope::teaches($userId, $subjectId)) {
            abort(403, 'You are not assigned to this subject.');
        }
    }

    public function submit(Request $request, int $assignmentId)
    {
        if ($this->role($request) !== 'student') {
            abort(403, 'Only students can submit assignments.');
        }

        $assignment = LmsAssignment::with('module')->findOrFail($assignmentId);
        $this->assertStudentEnrolledInSubject($request->user()->id, $assignment->module->subject_id);

        // Enforce deadline. With a strict deadline (allow_late = false) students
        // can't submit once due_at has passed. When the instructor has enabled
        // late submission, uploads are still accepted and flagged as late below.
        if ($assignment->due_at && $assignment->due_at->isPast() && !$assignment->allow_late) {
            return response()->json([
                'success' => false,
                'message' => 'The deadline for this assignment has passed. Please contact your instructor.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $mime = $file->getMimeType();
        $size = $file->getSize();

        if (!in_array($ext, self::ALLOWED_EXT, true) || !in_array($mime, self::ALLOWED_MIME, true)) {
            return response()->json(['success' => false, 'message' => 'Only PDF and DOCX files are allowed.'], 422);
        }
        if ($size > self::MAX_BYTES) {
            return response()->json(['success' => false, 'message' => 'File exceeds 20MB.'], 422);
        }

        $subject = Subject::find($assignment->module->subject_id);
        $instructorRow = LmsSubjectInstructor::where('subject_id', $subject->id ?? 0)->first();
        $instructorUser = $instructorRow ? User::find($instructorRow->user_id) : null;

        $folder = $this->buildSubmissionFolder($subject, $instructorUser, $assignment->id, $request->user()->id);
        $filename = Str::uuid()->toString() . '_' . $this->sanitizeName($file->getClientOriginalName());
        $path = $folder . '/' . $filename;

        Storage::disk(self::DISK)->put($path, file_get_contents($file->getRealPath()), [
            'visibility' => 'private',
            'ContentType' => $mime,
        ]);

        $submission = LmsSubmission::create([
            'assignment_id' => $assignment->id,
            'student_user_id' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'mime_type' => $mime,
            'size_bytes' => $size,
            'extension' => $ext,
            'submitted_at' => now(),
        ]);

        $late = LmsSubmission::computeLate($assignment->due_at, $submission->submitted_at);
        $submission->is_late = $late['is_late'];
        $submission->days_late = $late['days_late'];

        return response()->json(['success' => true, 'data' => $submission], 201);
    }

    public function indexByAssignment(Request $request, int $assignmentId)
    {
        $assignment = LmsAssignment::with('module')->findOrFail($assignmentId);
        $role = $this->role($request);

        if ($role === 'admin') {
            // ok
        } elseif ($role === 'instructor') {
            $this->assertInstructorAssigned($request->user()->id, $assignment->module->subject_id);
        } else {
            abort(403);
        }

        $submissions = LmsSubmission::where('assignment_id', $assignmentId)
            ->with(['student:id,name,email', 'grader:id,name'])
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json(['success' => true, 'data' => $submissions]);
    }

    public function mySubmissions(Request $request, int $assignmentId)
    {
        if ($this->role($request) !== 'student') abort(403);

        $assignment = LmsAssignment::with('module')->findOrFail($assignmentId);
        $this->assertStudentEnrolledInSubject($request->user()->id, $assignment->module->subject_id);

        $submissions = LmsSubmission::where('assignment_id', $assignmentId)
            ->where('student_user_id', $request->user()->id)
            ->orderByDesc('submitted_at')
            ->get();

        $submissions->each(function ($sub) use ($assignment) {
            $late = LmsSubmission::computeLate($assignment->due_at, $sub->submitted_at);
            $sub->is_late = $late['is_late'];
            $sub->days_late = $late['days_late'];
        });

        return response()->json(['success' => true, 'data' => $submissions]);
    }

    public function download(Request $request, int $submissionId)
    {
        $submission = LmsSubmission::with('assignment.module')->findOrFail($submissionId);
        $role = $this->role($request);
        $user = $request->user();
        $subjectId = $submission->assignment->module->subject_id;

        if ($role === 'admin') {
            // ok
        } elseif ($role === 'instructor') {
            $this->assertInstructorAssigned($user->id, $subjectId);
        } elseif ($role === 'student') {
            if ($submission->student_user_id !== $user->id) abort(403);
        } else {
            abort(403);
        }

        $disk = Storage::disk(self::DISK);
        if (!$disk->exists($submission->storage_path)) {
            return response()->json(['success' => false, 'message' => 'File not found in storage.'], 404);
        }

        $stream = $disk->readStream($submission->storage_path);
        return response()->stream(function () use ($stream) {
            fpassthru($stream);
        }, 200, [
            'Content-Type' => $submission->mime_type,
            'Content-Disposition' => 'attachment; filename="' . addslashes($submission->original_name) . '"',
            'Content-Length' => $submission->size_bytes,
            // Force download as an attachment and stop MIME-sniffing of the file.
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function grade(Request $request, int $submissionId)
    {
        $submission = LmsSubmission::with('assignment.module')->findOrFail($submissionId);
        $role = $this->role($request);

        if ($role === 'admin') {
            // ok
        } elseif ($role === 'instructor') {
            $this->assertInstructorAssigned($request->user()->id, $submission->assignment->module->subject_id);
        } else {
            abort(403);
        }

        $validator = Validator::make($request->all(), [
            'score' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $max = $submission->assignment->max_score ?? 100;
        if ($request->score > $max) {
            return response()->json(['success' => false, 'message' => "Score exceeds max ({$max})."], 422);
        }

        $submission->score = $request->score;
        $submission->feedback = $request->feedback;
        $submission->graded_by = $request->user()->id;
        $submission->graded_at = now();
        $submission->save();

        try {
            $assignment = $submission->assignment;
            $module = $assignment ? $assignment->module : null;
            LmsNotifier::send(
                (int) $submission->student_user_id,
                'grade_posted',
                'Grade posted: ' . ($assignment->title ?? 'Assignment'),
                'You received ' . $submission->score . ' / ' . ($assignment->max_score ?? 100) . '.',
                $module ? (int) $module->subject_id : null,
                $module ? ('/lms/subjects/' . $module->subject_id) : null,
                ['submission_id' => $submission->id, 'assignment_id' => $submission->assignment_id]
            );
        } catch (\Throwable $e) {
            // Never let a notification failure block grading.
        }

        return response()->json(['success' => true, 'data' => $submission]);
    }

    private function buildSubmissionFolder(?Subject $subject, ?User $instructor, int $assignmentId, int $studentId): string
    {
        $subjectSlug = $subject ? Str::slug($subject->subject_code ?: 'subject-' . $subject->id) : 'subject';
        $instructorSlug = $instructor ? Str::slug($instructor->name ?: 'instructor-' . $instructor->id) : 'instructor';
        return "lms/{$subjectSlug}/instructor_{$instructorSlug}/assignments/{$assignmentId}/submissions/student_{$studentId}";
    }

    private function sanitizeName(string $name): string
    {
        $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
        return substr($name, 0, 180);
    }
}
