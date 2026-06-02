<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsAnnouncement;
use App\Models\LMS\LmsInstructorScope;
use App\Models\LMS\LmsNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LmsAnnouncementController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    private function canManageSubject(Request $request, int $subjectId): bool
    {
        $role = $this->role($request);
        if ($role === 'admin') return true;
        if ($role === 'instructor') {
            return LmsInstructorScope::teaches($request->user()->id, $subjectId);
        }
        return false;
    }

    private function canViewSubject(Request $request, int $subjectId): bool
    {
        $role = $this->role($request);
        $user = $request->user();

        if ($role === 'admin') return true;
        if ($role === 'instructor') return LmsInstructorScope::teaches($user->id, $subjectId);

        if ($role === 'student') {
            return DB::table('student_subject')
                ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->where('student_subject.subject_id', $subjectId)
                ->exists();
        }
        return false;
    }

    /**
     * GET /subjects/{subjectId}/announcements
     * Students are filtered to announcements scoped to their own section, plus all-section ones.
     */
    public function indexBySubject(Request $request, int $subjectId)
    {
        if (!$this->canViewSubject($request, $subjectId)) abort(403);

        $role = $this->role($request);
        $user = $request->user();

        $query = LmsAnnouncement::where('subject_id', $subjectId)
            ->with(['creator:id,name', 'section:id,name']);

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

        $announcements = $query->orderByDesc('pinned')->orderByDesc('created_at')->get();
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|integer|exists:subjects,id',
            'section_id' => 'nullable|integer|exists:sections,id',
            'title' => 'required|string|max:255',
            'body' => 'nullable|string',
            'pinned' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $subjectId = (int) $request->subject_id;
        if (!$this->canManageSubject($request, $subjectId)) abort(403, 'Not allowed.');

        $sectionId = $request->section_id ? (int) $request->section_id : null;

        // Instructors may only target a section they actually teach.
        if ($sectionId && $this->role($request) === 'instructor') {
            $instructorRow = DB::table('instructors')->where('user_id', $request->user()->id)->first();
            $teaches = $instructorRow && DB::table('schedules')
                ->where('subject_id', $subjectId)
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

        $announcement = LmsAnnouncement::create([
            'subject_id' => $subjectId,
            'section_id' => $sectionId,
            'created_by' => $request->user()->id,
            'title' => $request->title,
            'body' => $request->body,
            'pinned' => $request->boolean('pinned', false),
        ]);

        // Fan out a notification to relevant students.
        LmsNotifier::sendToSubjectStudents(
            $subjectId,
            'announcement_posted',
            'New announcement: ' . $announcement->title,
            $announcement->body,
            $sectionId,
            '/lms/subjects/' . $subjectId,
            ['announcement_id' => $announcement->id]
        );

        $announcement->load(['creator:id,name', 'section:id,name']);
        return response()->json(['success' => true, 'data' => $announcement], 201);
    }

    public function update(Request $request, int $id)
    {
        $announcement = LmsAnnouncement::findOrFail($id);
        if (!$this->canManageSubject($request, $announcement->subject_id)) abort(403);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'body' => 'nullable|string',
            'pinned' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $announcement->fill($request->only(['title', 'body', 'pinned']));
        $announcement->save();

        $announcement->load(['creator:id,name', 'section:id,name']);
        return response()->json(['success' => true, 'data' => $announcement]);
    }

    public function destroy(Request $request, int $id)
    {
        $announcement = LmsAnnouncement::findOrFail($id);
        if (!$this->canManageSubject($request, $announcement->subject_id)) abort(403);
        $announcement->delete();
        return response()->json(['success' => true, 'message' => 'Announcement deleted.']);
    }
}
