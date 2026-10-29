<?php

namespace App\Http\Controllers;

use App\Exceptions\ClearanceException;
use App\Models\Clearance;
use App\Models\ClearanceItem;
use App\Models\ClearanceRole;
use App\Models\Instructor;
use App\Models\PreEnrolledStudent;
use App\Services\ClearanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * The clearance board.
 *
 * Who may sign what is decided by ClearanceService on every path — single,
 * bulk and scanned alike — so the answer cannot differ between them. This
 * class only decides what to show and what to answer with.
 */
class ClearanceController extends Controller
{
    public function __construct(private readonly ClearanceService $clearance)
    {
    }

    /** Anyone holding a line, plus the admin, may open the board. */
    private function denyUnlessApprover(): ?JsonResponse
    {
        $user = Auth::user();

        if (!$user || !$user->canAccessClearance()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not assigned to any clearance signature line.',
            ], 403);
        }

        return null;
    }

    private function fail(ClearanceException $e): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $e->getMessage()], $e->status());
    }

    // ───────────────────────────── reading ─────────────────────────────

    /**
     * Whether the clearance board belongs in this user's sidebar, and how
     * much is waiting there.
     *
     * Deliberately tiny: the sidebar asks on every page load, so it must not
     * drag the whole board's figures along with it. Answers for everyone
     * rather than 403ing, because "no" is the useful answer here.
     */
    public function access(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !$user->canAccessClearance()) {
            return response()->json(['success' => true, 'can_access' => false, 'pending' => 0]);
        }

        $roleIds = $this->clearance->heldRoleIds($user);
        $isAdmin = $user->isAdmin();

        // Which of their lines sit on which form. Someone who signs only
        // faculty lines has no business on the student board, and the sidebar
        // needs to be told that rather than guessing from the role.
        $byScope = ClearanceRole::whereIn('id', $roleIds)
            ->pluck('scope', 'id');

        $held = fn (string $scope) => $roleIds->filter(
            fn ($id) => ($byScope[$id] ?? ClearanceRole::SCOPE_STUDENT) === $scope
        );

        /**
         * For someone holding lines, the count is the lines waiting on them —
         * one tap each. For the admin, who can sign everything, that would be
         * every open line in the school, which says nothing useful; their
         * count is the subjects not yet cleared instead.
         */
        $pendingFor = function (string $scope) use ($isAdmin, $held) {
            $column = $scope === ClearanceRole::SCOPE_FACULTY
                ? 'instructor_id'
                : 'pre_enrolled_student_id';

            if ($isAdmin) {
                return DB::table('clearances')
                    ->whereNotNull($column)
                    ->where('status', 'pending')
                    ->count();
            }

            $ids = $held($scope);

            return $ids->isEmpty() ? 0 : DB::table('clearance_items')
                ->whereIn('clearance_role_id', $ids)
                ->where('status', 'pending')
                ->count();
        };

        return response()->json([
            'success' => true,
            'is_admin' => $isAdmin,
            'can_access' => $isAdmin || $held(ClearanceRole::SCOPE_STUDENT)->isNotEmpty(),
            'pending' => $pendingFor(ClearanceRole::SCOPE_STUDENT),
            'faculty_can_access' => $isAdmin || $held(ClearanceRole::SCOPE_FACULTY)->isNotEmpty(),
            'faculty_pending' => $pendingFor(ClearanceRole::SCOPE_FACULTY),
        ]);
    }

    /** What this approver can act on, and where the term stands. */
    public function overview(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $user = Auth::user();
        [$schoolYear, $semester] = $this->term($request);

        $roles = ClearanceRole::active()->forStudents()->inFormOrder()->get();
        $heldIds = $this->clearance->heldRoleIds($user);

        // forStudents throughout this controller: faculty clearances share
        // the table, and counting them here would inflate every figure on
        // the student board
        $scope = Clearance::forStudents()
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester));

        $totals = (clone $scope)
            ->selectRaw("COUNT(*) AS total, SUM(status = 'cleared') AS cleared")
            ->first();

        $clearanceIds = (clone $scope)->select('id');

        // Outstanding per line, as one grouped aggregate rather than a query
        // per role
        $pendingByRole = DB::table('clearance_items')
            ->whereIn('clearance_id', $clearanceIds)
            ->where('status', 'pending')
            ->selectRaw('clearance_role_id, COUNT(*) AS pending')
            ->groupBy('clearance_role_id')
            ->pluck('pending', 'clearance_role_id');

        return response()->json([
            'success' => true,
            'school_year' => $schoolYear,
            'semester' => $semester,
            'terms' => $this->termOptions(),
            'stats' => [
                'total' => (int) ($totals->total ?? 0),
                'cleared' => (int) ($totals->cleared ?? 0),
                'pending' => (int) ($totals->total ?? 0) - (int) ($totals->cleared ?? 0),
                // What this user personally still has to sign
                'mine_pending' => $heldIds->isEmpty() ? 0 : (int) $heldIds->sum(
                    fn ($id) => (int) ($pendingByRole[$id] ?? 0)
                ),
            ],
            'roles' => $roles->map(fn (ClearanceRole $role) => [
                'id' => $role->id,
                'code' => $role->code,
                'name' => $role->name,
                'description' => $role->description,
                'is_final' => $role->is_final,
                'is_mine' => $heldIds->contains($role->id),
                'pending' => (int) ($pendingByRole[$role->id] ?? 0),
            ]),
            'me' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'role_ids' => $heldIds->values(),
            ],
            'can' => [
                'approve_all' => $user->isAdmin(),
                'generate' => in_array($user->role, ['Admin', 'Registrar'], true),
            ],
        ]);
    }

    /**
     * The student list for a term.
     *
     * Paginated and filtered at the database — at eight hundred students on a
     * phone, anything else is unusable.
     */
    public function board(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $user = Auth::user();
        [$schoolYear, $semester] = $this->term($request);
        $search = trim((string) $request->input('search', ''));

        $heldIds = $this->clearance->heldRoleIds($user);
        $roleId = $request->input('role_id');

        // Default to the line this person actually signs, so the board opens
        // on their own work rather than on everyone's
        $focusRoleIds = $roleId
            ? collect([(int) $roleId])
            : ($user->isAdmin() ? collect() : $heldIds);

        $query = Clearance::forStudents()
            ->with(['student:id,student_id_number,first_name,last_name,course_id,year', 'student.course:id,course_code'])
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($search !== '', fn ($q) => $q->whereHas('student', function ($inner) use ($search) {
                $inner->where('student_id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]);
            }))
            ->when($request->filled('course_id'), fn ($q) => $q->whereHas(
                'student',
                fn ($inner) => $inner->where('course_id', $request->input('course_id'))
            ))
            ->when($request->filled('year_level'), fn ($q) => $q->whereHas(
                'student',
                fn ($inner) => $inner->where('year', $request->input('year_level'))
            ));

        // "Only the ones waiting on me"
        if ($request->boolean('mine_only') && $focusRoleIds->isNotEmpty()) {
            $query->whereHas('items', fn ($q) => $q
                ->whereIn('clearance_role_id', $focusRoleIds)
                ->where('status', 'pending'));
        }

        $page = $query
            ->orderBy('status')
            ->orderByDesc('id')
            ->paginate(min((int) $request->input('per_page', 25), 100));

        $rows = collect($page->items());
        $items = $this->itemsFor($rows->pluck('id'));

        return response()->json([
            'success' => true,
            'data' => $rows->map(function (Clearance $clearance) use ($items, $heldIds, $user) {
                $mine = $items->get($clearance->id, collect());
                $approved = $mine->where('status', 'approved')->count();

                return [
                    'id' => $clearance->id,
                    'status' => $clearance->status,
                    'school_year' => $clearance->school_year,
                    'semester' => $clearance->semester,
                    'term_label' => $clearance->term_label,
                    'cleared_at' => $clearance->cleared_at?->toDateTimeString(),
                    'student' => [
                        'id' => $clearance->student->id ?? null,
                        'name' => $clearance->student?->getFullNameAttribute(),
                        'student_id_number' => $clearance->student->student_id_number ?? null,
                        'course' => $clearance->student?->course->course_code ?? null,
                        'year_level' => $clearance->student->year ?? null,
                    ],
                    'progress' => ['approved' => $approved, 'total' => $mine->count()],
                    // Only the lines this user can act on, so a phone shows
                    // one button rather than sixteen
                    'my_items' => $mine
                        ->filter(fn ($item) => $user->isAdmin() || $heldIds->contains($item->clearance_role_id))
                        ->map(fn ($item) => $this->itemPayload($item))
                        ->values(),
                ];
            }),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /** Every line on one student's clearance, for the detail sheet. */
    public function show(Clearance $clearance): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $user = Auth::user();
        $heldIds = $this->clearance->heldRoleIds($user);

        $clearance->load([
            'student:id,student_id_number,first_name,last_name,course_id,year',
            'student.course:id,course_code,course_name',
            'instructor:id,name,title,department',
            'items.role',
            'items.approver:id,name',
        ]);

        $outstanding = $this->clearance->outstandingRoleNames($clearance);
        $faculty = $clearance->isFaculty();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $clearance->id,
                'status' => $clearance->status,
                'term_label' => $clearance->term_label,
                'school_year' => $clearance->school_year,
                'semester' => $clearance->semester,
                'cleared_at' => $clearance->cleared_at?->toDateTimeString(),
                // Whoever the clearance is for, in one shape the sheet can
                // render without knowing which kind it is
                'subject' => [
                    'kind' => $faculty ? 'faculty' : 'student',
                    'name' => $faculty
                        ? $clearance->instructor?->name
                        : $clearance->student?->getFullNameAttribute(),
                    'identifier' => $faculty
                        ? $clearance->instructor?->title
                        : $clearance->student?->student_id_number,
                    'detail' => $faculty
                        ? $clearance->instructor?->department_label
                        : trim(implode(' · ', array_filter([
                            $clearance->student?->course->course_name,
                            $clearance->student?->year,
                        ]))),
                ],
                // Kept for the student sheet, which reads these directly
                'student' => [
                    'id' => $clearance->student->id ?? null,
                    'name' => $clearance->student?->getFullNameAttribute(),
                    'student_id_number' => $clearance->student->student_id_number ?? null,
                    'course' => $clearance->student?->course->course_name ?? null,
                    'year_level' => $clearance->student->year ?? null,
                ],
                'items' => $clearance->items
                    ->filter(fn ($item) => $item->role?->is_active)
                    ->sortBy(fn ($item) => $item->role->sort_order)
                    ->map(fn ($item) => $this->itemPayload($item) + [
                        // Asked of the service, not worked out from the held
                        // ids: a line may name a stand-in — the faculty TESDA
                        // line, which the Registrar may sign — and only the
                        // service knows that rule. Deciding it here as well
                        // is how the button and the server come to disagree.
                        'can_sign' => $this->clearance->canSign($user, $item->role),
                        'approver_name' => $item->approver->name ?? null,
                    ])
                    ->values(),
                'outstanding' => $outstanding->values(),
            ],
        ]);
    }

    /**
     * Resolves a scanned student code.
     *
     * Answers with the student's current clearance and only the lines the
     * scanner may sign, which is what lets a phone go straight from scan to
     * one tap.
     */
    public function scan(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), ['token' => 'required|string|max:64']);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'That code could not be read.'], 422);
        }

        $student = PreEnrolledStudent::with('course.program')
            ->where('clearance_qr_token', $request->input('token'))
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'That code does not match any student.',
            ], 404);
        }

        [$schoolYear, $semester] = $this->term($request);

        $clearance = Clearance::where('pre_enrolled_student_id', $student->id)
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->latest('id')
            ->first();

        if (!$clearance) {
            return response()->json([
                'success' => false,
                'message' => $student->getFullNameAttribute() . ' has no clearance for this term.',
            ], 404);
        }

        return $this->show($clearance);
    }

    /**
     * The signed-in student's own clearance and the code they present.
     *
     * Open to the student themselves rather than to approvers, so it does
     * not go through the approver gate. The token is the student's own and
     * identifies nobody else.
     */
    public function myClearance(Request $request): JsonResponse
    {
        $user = Auth::user();
        $student = PreEnrolledStudent::with('course.program')
            ->where('user_id', $user?->id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'This account is not linked to a student record.',
            ], 404);
        }

        // Issued on first view for any record that predates the feature
        if (!$student->clearance_qr_token) {
            $student->forceFill(['clearance_qr_token' => bin2hex(random_bytes(16))])->save();
        }

        $clearances = Clearance::with(['items.role', 'items.approver:id,name'])
            ->where('pre_enrolled_student_id', $student->id)
            ->orderByDesc('school_year')
            ->orderBy('semester')
            ->get();

        return response()->json([
            'success' => true,
            'student' => [
                'name' => $student->getFullNameAttribute(),
                'student_id_number' => $student->student_id_number,
                'course' => $student->course->course_code ?? null,
                'year_level' => $student->year,
            ],
            'qr_token' => $student->clearance_qr_token,
            'data' => $clearances->map(fn (Clearance $clearance) => [
                'id' => $clearance->id,
                'term_label' => $clearance->term_label,
                'school_year' => $clearance->school_year,
                'semester' => $clearance->semester,
                'status' => $clearance->status,
                'cleared_at' => $clearance->cleared_at?->toDateTimeString(),
                'items' => $clearance->items
                    ->filter(fn ($item) => $item->role?->is_active)
                    ->sortBy(fn ($item) => $item->role->sort_order)
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'role_name' => $item->role->name,
                        'status' => $item->status,
                        'approved_at' => $item->approved_at?->toDateTimeString(),
                        'approver_name' => $item->approver->name ?? null,
                    ])->values(),
            ]),
        ]);
    }

    /**
     * Grades sitting at INC only because the student is not yet cleared.
     *
     * Kept apart from the INC records proper: these are not awaiting a
     * payment or an instructor's completion, and nobody should process them
     * as though they were. They clear themselves when the clearance is
     * signed, so the list is a view of what is blocked, not a work queue.
     *
     * The desks and the signatories see the school's holds. An instructor
     * sees the holds on the classes they teach and nothing else — enough to
     * explain why their own grading sheet reads INC, without opening every
     * student's clearance standing to every member of the faculty.
     */
    public function heldGrades(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $desks = ['Admin', 'Registrar', 'Program Head', 'Cashier'];
        $seesEverything = in_array($user->role, $desks, true) || $user->canAccessClearance();

        // Resolved to an id, not trusted from the request: an instructor can
        // only ever be scoped to their own record.
        $instructorId = $seesEverything
            ? null
            : Instructor::where('user_id', $user->id)->value('id');

        if (!$seesEverything && !$instructorId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $search = trim((string) $request->input('search', ''));

        $query = DB::table('grades as g')
            ->join('pre_enrolled_students as s', 's.id', '=', 'g.pre_enrolled_student_id')
            ->join('subjects as sub', 'sub.id', '=', 'g.subject_id')
            ->leftJoin('courses as c', 'c.id', '=', 's.course_id')
            ->where('g.clearance_hold', true)
            // Second column of grades_held_instructor_index, so an instructor
            // seeks straight to their own rows rather than reading every held
            // grade in the school and discarding the rest
            ->when($instructorId, fn ($q) => $q->where('g.instructor_id', $instructorId))
            ->when($request->filled('school_year'), fn ($q) => $q->where('g.school_year', $request->input('school_year')))
            ->when($request->filled('semester'), fn ($q) => $q->where('g.semester', $request->input('semester')))
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('s.student_id_number', 'like', "%{$search}%")
                    ->orWhere('s.first_name', 'like', "%{$search}%")
                    ->orWhere('s.last_name', 'like', "%{$search}%")
                    ->orWhere('sub.subject_code', 'like', "%{$search}%");
            }))
            ->select([
                'g.id',
                'g.school_year',
                'g.semester',
                'g.year',
                'g.held_status',
                'g.final_grade',
                's.id as student_id',
                's.student_id_number',
                DB::raw("TRIM(CONCAT(COALESCE(s.last_name,''), ', ', COALESCE(s.first_name,''))) AS student_name"),
                'c.course_code',
                'sub.subject_code',
                // The subjects table calls it descriptive_title
                'sub.descriptive_title as subject_name',
            ])
            // Sorted on the columns themselves rather than the concatenated
            // alias: ordering by the alias makes the database build the whole
            // string for every candidate row before it can sort them
            ->orderBy('s.last_name')
            ->orderBy('s.first_name')
            ->orderBy('sub.subject_code');

        $page = $query->paginate(min((int) $request->input('per_page', 25), 100));

        // What each of those students is still waiting on, in one query
        $items = collect($page->items());
        $studentIds = $items->pluck('student_id')->unique();

        $outstanding = $studentIds->isEmpty() ? collect() : DB::table('clearance_items as i')
            ->join('clearances as cl', 'cl.id', '=', 'i.clearance_id')
            ->join('clearance_roles as r', 'r.id', '=', 'i.clearance_role_id')
            ->whereIn('cl.pre_enrolled_student_id', $studentIds)
            // Narrowed to the years on this page, and keyed by term below.
            // Matching on the student alone listed a second term's unsigned
            // lines against this term's grade — under that other term's
            // clearance id, which is the one the row then linked to.
            ->whereIn('cl.school_year', $items->pluck('school_year')->unique())
            ->where('i.status', 'pending')
            ->where('r.is_active', true)
            ->select(
                'cl.pre_enrolled_student_id as student_id',
                'cl.school_year',
                'cl.semester',
                'cl.id as clearance_id',
                'r.name'
            )
            ->orderBy('r.sort_order')
            ->get()
            ->groupBy(fn ($row) => "{$row->student_id}|{$row->school_year}|{$row->semester}");

        return response()->json([
            'success' => true,
            'data' => $items->map(function ($row) use ($outstanding) {
                // Senior High clears once for the whole year, so its grades
                // answer to that clearance rather than to a semester one
                $waiting = $outstanding->get("{$row->student_id}|{$row->school_year}|{$row->semester}")
                    ?? $outstanding->get("{$row->student_id}|{$row->school_year}|" . Clearance::WHOLE_YEAR)
                    ?? collect();

                return [
                    'id' => $row->id,
                    'student' => [
                        'id' => $row->student_id,
                        'name' => $row->student_name,
                        'student_id_number' => $row->student_id_number,
                        'course' => $row->course_code,
                    ],
                    'subject' => ['code' => $row->subject_code, 'name' => $row->subject_name],
                    'term' => "{$row->semester}, {$row->school_year}",
                    'year_level' => $row->year,
                    'final_grade' => $row->final_grade !== null ? (float) $row->final_grade : null,
                    // The result it goes back to once the clearance is signed
                    'held_status' => $row->held_status,
                    'clearance_id' => $waiting->first()->clearance_id ?? null,
                    'outstanding' => $waiting->pluck('name')->values(),
                ];
            }),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                // So the page can say whose holds these are rather than
                // leaving an instructor to assume the school has only a few
                'scope' => $instructorId ? 'own_classes' : 'all',
            ],
        ]);
    }

    // ───────────────────────────── signing ─────────────────────────────

    public function approve(Request $request, ClearanceItem $item): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        try {
            $approved = $this->clearance->approve(
                $item,
                Auth::user(),
                $request->input('remarks')
            );
        } catch (ClearanceException $e) {
            return $this->fail($e);
        }

        $clearance = $approved->clearance->fresh();

        return response()->json([
            'success' => true,
            'message' => "{$approved->role->name} signed.",
            'data' => $this->itemPayload($approved),
            'clearance_status' => $clearance->status,
        ]);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'clearance_ids' => 'required|array|min:1|max:500',
            'clearance_ids.*' => 'integer|exists:clearances,id',
            'clearance_role_id' => 'required|exists:clearance_roles,id',
            'remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $role = ClearanceRole::findOrFail($request->input('clearance_role_id'));

        try {
            $result = $this->clearance->bulkApprove(
                $request->input('clearance_ids'),
                $role,
                Auth::user(),
                $request->input('remarks')
            );
        } catch (ClearanceException $e) {
            return $this->fail($e);
        }

        $skipped = count($result['skipped']);

        return response()->json([
            'success' => true,
            'message' => $result['approved'] === 0 && $skipped > 0
                ? "Nothing signed — {$skipped} student(s) are still waiting on other lines."
                : "{$role->name} signed for {$result['approved']} student(s)."
                    . ($skipped > 0 ? " {$skipped} skipped, still waiting on other lines." : '')
                    . ($result['cleared'] > 0 ? " {$result['cleared']} now fully cleared." : ''),
            'approved' => $result['approved'],
            'skipped' => $result['skipped'],
            'cleared' => $result['cleared'],
        ]);
    }

    /** The admin's override — signs every outstanding line. */
    public function approveAll(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'clearance_ids' => 'required|array|min:1|max:500',
            'clearance_ids.*' => 'integer|exists:clearances,id',
            'remarks' => 'nullable|string|max:1000',
            // Whether the students hear about it. Only ever honoured here,
            // where the service has already established the caller is admin.
            'notify' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $notify = $request->boolean('notify', true);

        try {
            $result = $this->clearance->approveAll(
                $request->input('clearance_ids'),
                Auth::user(),
                $request->input('remarks') ?: 'Signed by the admin on the holders\' behalf',
                $notify
            );
        } catch (ClearanceException $e) {
            return $this->fail($e);
        }

        $message = "{$result['approved']} signature line(s) signed. {$result['cleared']} student(s) now fully cleared.";

        return response()->json([
            'success' => true,
            'message' => $notify
                ? $message
                : "{$message} No email was sent.",
            'approved' => $result['approved'],
            'cleared' => $result['cleared'],
            'notified' => $notify,
        ]);
    }

    /** Creates any missing clearances for a term (registrar and admin). */
    public function generate(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only an admin or registrar can generate clearances.',
            ], 403);
        }

        [$schoolYear, $semester] = $this->term($request);
        $result = $this->clearance->backfillTerm($schoolYear, $semester);

        return response()->json([
            'success' => true,
            'message' => $result['clearances'] === 0 && $result['items'] === 0
                ? 'Every enrolled student already has a clearance for this term.'
                : "{$result['clearances']} clearance(s) and {$result['items']} signature line(s) created.",
            'data' => $result,
        ]);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    /**
     * The term being looked at.
     *
     * Always settles on one concrete term rather than a whole year. A year
     * holds both college semesters and the Senior High whole-year rows, and
     * adding those together counts different populations as one — besides
     * leaving the picker with nothing to show as selected.
     */
    private function term(Request $request): array
    {
        $schoolYear = trim((string) $request->input('school_year', ''));
        $semester = trim((string) $request->input('semester', ''));

        if ($schoolYear !== '' && $semester !== '') {
            return [$schoolYear, $semester];
        }

        if ($schoolYear === '') {
            $schoolYear = Clearance::forStudents()->max('school_year')
                ?? DB::table('pre_enrolled_students')->max('school_year')
                ?? '';
        }

        // The first term of that year that actually has clearances, which is
        // also the first entry the picker lists
        $semester = DB::table('clearances')
            ->whereNotNull('pre_enrolled_student_id')
            ->where('school_year', $schoolYear)
            ->orderBy('semester')
            ->value('semester');

        return [$schoolYear, $semester];
    }

    /** The terms that actually have clearances, for the picker. */
    private function termOptions(): array
    {
        return DB::table('clearances')
            ->whereNotNull('pre_enrolled_student_id')
            ->selectRaw('school_year, semester, COUNT(*) AS total')
            ->groupBy('school_year', 'semester')
            ->orderByDesc('school_year')
            ->orderBy('semester')
            ->get()
            ->map(fn ($row) => [
                'school_year' => $row->school_year,
                'semester' => $row->semester,
                'label' => $row->semester === Clearance::WHOLE_YEAR
                    ? "{$row->school_year} — Senior High"
                    : "{$row->semester}, {$row->school_year}",
                'total' => (int) $row->total,
            ])
            ->all();
    }

    /** Items for a page of clearances, grouped, in one query. */
    private function itemsFor($clearanceIds)
    {
        if ($clearanceIds->isEmpty()) {
            return collect();
        }

        return ClearanceItem::with('role:id,code,name,sort_order,is_final,is_active')
            ->whereIn('clearance_id', $clearanceIds)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->get()
            ->sortBy(fn ($item) => $item->role->sort_order)
            ->groupBy('clearance_id');
    }

    private function itemPayload(ClearanceItem $item): array
    {
        return [
            'id' => $item->id,
            'clearance_id' => $item->clearance_id,
            'clearance_role_id' => $item->clearance_role_id,
            'role_name' => $item->role->name ?? null,
            'role_code' => $item->role->code ?? null,
            'is_final' => (bool) ($item->role->is_final ?? false),
            'status' => $item->status,
            'approved_at' => $item->approved_at?->toDateTimeString(),
            'on_behalf' => $item->on_behalf,
            'remarks' => $item->remarks,
        ];
    }
}
