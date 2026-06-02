<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\User;
use App\Models\LMS\LmsModule;
use App\Models\LMS\LmsModuleFile;
use App\Models\LMS\LmsSubjectInstructor;
use App\Models\LMS\LmsInstructorScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LmsModuleController extends Controller
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

    private function assertCanManageSubject(Request $request, int $subjectId): void
    {
        $role = $this->role($request);
        if ($role === 'admin') return;
        if ($role === 'instructor') {
            if (!LmsInstructorScope::teaches($request->user()->id, $subjectId)) {
                abort(403, 'Not assigned to this subject.');
            }
            return;
        }
        abort(403, 'Only admins or assigned instructors can manage modules.');
    }

    private function assertCanViewSubject(Request $request, int $subjectId): void
    {
        $role = $this->role($request);
        $user = $request->user();

        if ($role === 'admin') return;

        if ($role === 'instructor') {
            if (!LmsInstructorScope::teaches($user->id, $subjectId)) abort(403);
            return;
        }

        if ($role === 'student') {
            $enrolled = DB::table('student_subject')
                ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->where('student_subject.subject_id', $subjectId)
                ->exists();
            if (!$enrolled) abort(403);
            return;
        }
        abort(403);
    }

    public function indexBySubject(Request $request, int $subjectId)
    {
        $this->assertCanViewSubject($request, $subjectId);

        $query = LmsModule::where('subject_id', $subjectId)
            ->with(['files', 'creator:id,name', 'assignments', 'section:id,name'])
            ->orderBy('order_index')
            ->orderBy('id');

        $role = $this->role($request);
        $user = $request->user();

        // Students can only see modules for sections they belong to (or null = all sections)
        if ($role === 'student') {
            $studentSectionIds = DB::table('section_student')
                ->join('pre_enrolled_students', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->pluck('section_student.section_id')
                ->all();

            $query->where(function ($q) use ($studentSectionIds) {
                $q->whereNull('section_id');
                if (!empty($studentSectionIds)) {
                    $q->orWhereIn('section_id', $studentSectionIds);
                }
            });
        }

        // Optional explicit section filter (instructors/admin can use this)
        if ($request->filled('section_id')) {
            $sid = $request->section_id === 'null' || $request->section_id === '0'
                ? null
                : (int) $request->section_id;

            if (is_null($sid)) {
                $query->whereNull('section_id');
            } else {
                $query->where('section_id', $sid);
            }
        }

        $modules = $query->get();

        return response()->json(['success' => true, 'data' => $modules]);
    }

    public function show(Request $request, int $id)
    {
        $module = LmsModule::with(['files', 'creator:id,name', 'assignments'])->findOrFail($id);
        $this->assertCanViewSubject($request, $module->subject_id);
        return response()->json(['success' => true, 'data' => $module]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|integer|exists:subjects,id',
            'section_id' => 'nullable|integer|exists:sections,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $this->assertCanManageSubject($request, (int) $request->subject_id);

        // If section_id provided, instructors may only target sections they actually teach.
        $sectionId = $request->section_id ? (int) $request->section_id : null;
        if ($sectionId && $this->role($request) === 'instructor') {
            $instructorRow = DB::table('instructors')->where('user_id', $request->user()->id)->first();
            $teaches = $instructorRow && DB::table('schedules')
                ->where('subject_id', $request->subject_id)
                ->where('section_id', $sectionId)
                ->where('instructor_id', $instructorRow->id)
                ->exists();
            if (!$teaches) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not teaching that section for this subject.',
                ], 422);
            }
        }

        $module = LmsModule::create([
            'subject_id' => $request->subject_id,
            'section_id' => $sectionId,
            'created_by' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'order_index' => $request->order_index ?? 0,
            'is_published' => $request->boolean('is_published', true),
        ]);

        $module->load('section:id,name');

        return response()->json(['success' => true, 'data' => $module], 201);
    }

    public function update(Request $request, int $id)
    {
        $module = LmsModule::findOrFail($id);
        $this->assertCanManageSubject($request, $module->subject_id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $module->fill($request->only(['title', 'description', 'order_index', 'is_published']));
        $module->save();

        return response()->json(['success' => true, 'data' => $module]);
    }

    public function destroy(Request $request, int $id)
    {
        $module = LmsModule::with('files')->findOrFail($id);
        $this->assertCanManageSubject($request, $module->subject_id);

        foreach ($module->files as $f) {
            try { Storage::disk(self::DISK)->delete($f->storage_path); } catch (\Throwable $e) {}
        }

        $module->delete();
        return response()->json(['success' => true, 'message' => 'Module deleted.']);
    }

    public function uploadFile(Request $request, int $moduleId)
    {
        $module = LmsModule::findOrFail($moduleId);
        $this->assertCanManageSubject($request, $module->subject_id);

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
            return response()->json([
                'success' => false,
                'message' => 'Only PDF and DOCX files are allowed.',
            ], 422);
        }
        if ($size > self::MAX_BYTES) {
            return response()->json(['success' => false, 'message' => 'File exceeds 20MB.'], 422);
        }

        $subject = Subject::find($module->subject_id);
        $instructor = User::find($module->created_by);
        $folder = $this->buildModuleFolder($subject, $instructor, $module->id);

        $filename = Str::uuid()->toString() . '_' . $this->sanitizeName($file->getClientOriginalName());
        $path = $folder . '/' . $filename;

        Storage::disk(self::DISK)->put($path, file_get_contents($file->getRealPath()), [
            'visibility' => 'private',
            'ContentType' => $mime,
        ]);

        $record = LmsModuleFile::create([
            'module_id' => $module->id,
            'uploaded_by' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'mime_type' => $mime,
            'size_bytes' => $size,
            'extension' => $ext,
        ]);

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    public function deleteFile(Request $request, int $fileId)
    {
        $file = LmsModuleFile::with('module')->findOrFail($fileId);
        $this->assertCanManageSubject($request, $file->module->subject_id);

        try { Storage::disk(self::DISK)->delete($file->storage_path); } catch (\Throwable $e) {}
        $file->delete();

        return response()->json(['success' => true, 'message' => 'File deleted.']);
    }

    public function downloadFile(Request $request, int $fileId)
    {
        $file = LmsModuleFile::with('module')->findOrFail($fileId);
        $this->assertCanViewSubject($request, $file->module->subject_id);

        $disk = Storage::disk(self::DISK);
        if (!$disk->exists($file->storage_path)) {
            return response()->json(['success' => false, 'message' => 'File not found in storage.'], 404);
        }

        $stream = $disk->readStream($file->storage_path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
        }, 200, [
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'attachment; filename="' . addslashes($file->original_name) . '"',
            'Content-Length' => $file->size_bytes,
            // Force download as an attachment and stop MIME-sniffing of the file.
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function buildModuleFolder(?Subject $subject, ?User $instructor, int $moduleId): string
    {
        $subjectSlug = $subject ? Str::slug($subject->subject_code ?: 'subject-' . $subject->id) : 'subject';
        $instructorSlug = $instructor ? Str::slug($instructor->name ?: 'instructor-' . $instructor->id) : 'instructor';
        return "lms/{$subjectSlug}/instructor_{$instructorSlug}/modules/{$moduleId}";
    }

    private function sanitizeName(string $name): string
    {
        $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
        return substr($name, 0, 180);
    }
}
