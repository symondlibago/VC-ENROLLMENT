<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\User;
use App\Models\LMS\LmsSubjectInstructor;
use App\Models\LMS\LmsInstructorScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LmsSubjectController extends Controller
{
    private function role(Request $request): string
    {
        return strtolower($request->user()->role ?? '');
    }

    /**
     * Build the unified instructor list for a subject:
     *   - users in lms_subject_instructor pivot (admin-assigned), AND
     *   - users tied to schedules.instructor_id for this subject (existing system)
     * Returns a collection of {id, name, email}.
     */
    private function instructorsForSubject(int $subjectId)
    {
        $fromPivot = LmsSubjectInstructor::where('subject_id', $subjectId)
            ->join('users', 'users.id', '=', 'lms_subject_instructor.user_id')
            ->select('users.id', 'users.name', 'users.email');

        $fromSchedules = DB::table('schedules')
            ->join('instructors', 'schedules.instructor_id', '=', 'instructors.id')
            ->join('users', 'users.id', '=', 'instructors.user_id')
            ->where('schedules.subject_id', $subjectId)
            ->whereNotNull('schedules.instructor_id')
            ->select('users.id', 'users.name', 'users.email');

        return $fromPivot->union($fromSchedules)->get()->unique('id')->values();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $role = $this->role($request);

        $query = Subject::query()->select('id', 'subject_code', 'descriptive_title', 'course_id', 'year', 'semester');

        if ($role === 'instructor') {
            $assignedIds = LmsInstructorScope::subjectIdsFor($user->id);
            $query->whereIn('id', $assignedIds);
        } elseif ($role === 'student') {
            $assignedIds = DB::table('student_subject')
                ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->pluck('student_subject.subject_id');
            $query->whereIn('id', $assignedIds);
        }

        $subjects = $query->orderBy('subject_code')->get();

        $subjects->each(function ($subject) {
            $subject->instructors = $this->instructorsForSubject((int) $subject->id);
        });

        return response()->json(['success' => true, 'data' => $subjects]);
    }

    public function show(Request $request, int $id)
    {
        $this->ensureCanAccessSubject($request, $id);

        $subject = Subject::findOrFail($id);
        $subject->instructors = $this->instructorsForSubject($id);

        return response()->json(['success' => true, 'data' => $subject]);
    }

    /**
     * Sections that are relevant to the current user for this subject.
     * - admin: all sections that appear in schedules for the subject
     * - instructor: only sections they teach for this subject
     * - student: only the section(s) they are enrolled in for this subject
     */
    public function sections(Request $request, int $id)
    {
        $this->ensureCanAccessSubject($request, $id);
        $user = $request->user();
        $role = $this->role($request);

        $query = DB::table('sections')
            ->join('schedules', 'schedules.section_id', '=', 'sections.id')
            ->where('schedules.subject_id', $id)
            ->whereNotNull('schedules.section_id')
            ->select('sections.id', 'sections.name')
            ->distinct();

        if ($role === 'instructor') {
            $instructorRow = DB::table('instructors')->where('user_id', $user->id)->first();
            if (!$instructorRow) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $query->where('schedules.instructor_id', $instructorRow->id);
        } elseif ($role === 'student') {
            $studentSectionIds = DB::table('section_student')
                ->join('pre_enrolled_students', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->pluck('section_student.section_id');
            $query->whereIn('sections.id', $studentSectionIds);
        }

        $sections = $query->orderBy('sections.name')->get();
        return response()->json(['success' => true, 'data' => $sections]);
    }

    public function assignInstructor(Request $request, int $id)
    {
        if ($this->role($request) !== 'admin') {
            abort(403, 'Only admins can assign instructors.');
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $instructor = User::findOrFail($request->user_id);
        if (strtolower($instructor->role ?? '') !== 'instructor') {
            return response()->json(['success' => false, 'message' => 'Selected user is not an instructor.'], 422);
        }

        Subject::findOrFail($id);

        LmsSubjectInstructor::firstOrCreate([
            'subject_id' => $id,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Instructor assigned.']);
    }

    public function unassignInstructor(Request $request, int $id, int $userId)
    {
        if ($this->role($request) !== 'admin') {
            abort(403, 'Only admins can unassign instructors.');
        }

        LmsSubjectInstructor::where('subject_id', $id)->where('user_id', $userId)->delete();

        return response()->json(['success' => true, 'message' => 'Instructor unassigned.']);
    }

    public function availableInstructors(Request $request)
    {
        if ($this->role($request) !== 'admin') {
            abort(403);
        }

        $instructors = User::query()
            ->whereRaw('LOWER(role) = ?', ['instructor'])
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $instructors]);
    }

    public function ensureCanAccessSubject(Request $request, int $subjectId): void
    {
        $user = $request->user();
        $role = $this->role($request);

        if ($role === 'admin') return;

        if ($role === 'instructor') {
            if (!LmsInstructorScope::teaches($user->id, $subjectId)) {
                abort(403, 'Not assigned to this subject.');
            }
            return;
        }

        if ($role === 'student') {
            $enrolled = DB::table('student_subject')
                ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
                ->where('pre_enrolled_students.user_id', $user->id)
                ->where('student_subject.subject_id', $subjectId)
                ->exists();
            if (!$enrolled) abort(403, 'You are not enrolled in this subject.');
            return;
        }

        abort(403, 'Unauthorized role.');
    }
}
