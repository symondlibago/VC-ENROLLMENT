<?php

namespace App\Http\Controllers;

use App\Models\Clearance;
use App\Models\ClearanceRole;
use App\Models\Instructor;
use App\Models\SchoolYear;
use App\Services\ClearanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * The faculty clearance board.
 *
 * Only the views live here. Signing goes through the same endpoints the
 * student board uses, because a clearance item is a clearance item whoever
 * it belongs to — and ClearanceService is the single place that decides who
 * may sign what, including the cashier-last gate and the admin override.
 */
class FacultyClearanceController extends Controller
{
    public function __construct(private ClearanceService $clearance)
    {
    }

    /** Anyone who signs a faculty line, plus the admin. */
    private function denyUnlessApprover(): ?JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($user->isAdmin()) {
            return null;
        }

        $holdsFacultyLine = ClearanceRole::forFaculty()
            ->whereIn('id', $this->clearance->heldRoleIds($user))
            ->exists();

        return $holdsFacultyLine
            ? null
            : response()->json([
                'success' => false,
                'message' => 'You are not assigned to any faculty clearance line.',
            ], 403);
    }

    /** What this approver can act on, and where the term stands. */
    public function overview(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $user = Auth::user();
        [$schoolYear, $semester] = $this->term($request);

        $roles = ClearanceRole::active()->forFaculty()->inFormOrder()->get();
        $heldIds = $this->clearance->heldRoleIds($user);

        $scope = Clearance::forFaculty()
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester));

        $totals = (clone $scope)
            ->selectRaw("COUNT(*) AS total, SUM(status = 'cleared') AS cleared")
            ->first();

        $clearanceIds = (clone $scope)->select('id');

        // Outstanding per line, as one grouped aggregate rather than a query
        // per line
        $outstanding = DB::table('clearance_items')
            ->whereIn('clearance_id', $clearanceIds)
            ->where('status', 'pending')
            ->selectRaw('clearance_role_id, COUNT(*) AS total')
            ->groupBy('clearance_role_id')
            ->pluck('total', 'clearance_role_id');

        $mine = $roles->filter(fn (ClearanceRole $role) => $this->clearance->canSign($user, $role));

        return response()->json([
            'success' => true,
            'data' => [
                'term' => ['school_year' => $schoolYear, 'semester' => $semester],
                'terms' => $this->termOptions(),
                'totals' => [
                    'total' => (int) ($totals->total ?? 0),
                    'cleared' => (int) ($totals->cleared ?? 0),
                    'pending' => (int) ($totals->total ?? 0) - (int) ($totals->cleared ?? 0),
                ],
                'me' => [
                    'is_admin' => $user->isAdmin(),
                    'role_ids' => $heldIds->values(),
                    // Lines this person may sign, the stand-in rule included
                    'signable_role_ids' => $mine->pluck('id')->values(),
                    'waiting_on_me' => $mine->sum(fn ($role) => (int) ($outstanding[$role->id] ?? 0)),
                ],
                'can' => [
                    'generate' => in_array($user->role, ['Admin', 'Registrar'], true),
                    'approve_all' => $user->isAdmin(),
                ],
                'roles' => $roles->map(fn (ClearanceRole $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_final' => $role->is_final,
                    'alt_role_id' => $role->alt_role_id,
                    'outstanding' => (int) ($outstanding[$role->id] ?? 0),
                    'can_sign' => $this->clearance->canSign($user, $role),
                ])->values(),
            ],
        ]);
    }

    /** One row per instructor for the chosen term. */
    public function board(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessApprover()) {
            return $denied;
        }

        $user = Auth::user();
        [$schoolYear, $semester] = $this->term($request);
        $search = trim((string) $request->input('search', ''));

        $roleId = $request->input('role_id');
        $signable = ClearanceRole::active()->forFaculty()->get()
            ->filter(fn (ClearanceRole $role) => $this->clearance->canSign($user, $role))
            ->pluck('id');

        $focusRoleIds = $roleId
            ? collect([(int) $roleId])
            : ($user->isAdmin() ? collect() : $signable);

        $query = Clearance::forFaculty()
            ->with('instructor:id,name,title,department')
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($search !== '', function ($q) use ($search) {
                // Searching a label has to find the slug it stands for, or
                // "Senior High School" would match nothing while the rows
                // filed as `shs` sit right there
                $slugs = collect(Instructor::DEPARTMENTS)
                    ->filter(fn (string $label) => stripos($label, $search) !== false)
                    ->keys();

                $q->whereHas('instructor', fn ($inner) => $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->when($slugs->isNotEmpty(), fn ($x) => $x->orWhereIn('department', $slugs)));
            });

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

        // Every row's lines in one query rather than one per row
        $items = DB::table('clearance_items as i')
            ->join('clearance_roles as r', 'r.id', '=', 'i.clearance_role_id')
            ->whereIn('i.clearance_id', $rows->pluck('id'))
            ->where('r.is_active', true)
            // The name comes along so each row can say who it is waiting on
            // without a second query per row
            ->select('i.clearance_id', 'i.clearance_role_id', 'i.status', 'r.name', 'r.sort_order')
            ->orderBy('r.sort_order')
            ->get()
            ->groupBy('clearance_id');

        return response()->json([
            'success' => true,
            'data' => $rows->map(function (Clearance $clearance) use ($items, $focusRoleIds) {
                $mine = $items->get($clearance->id, collect());

                return [
                    'id' => $clearance->id,
                    'status' => $clearance->status,
                    'term_label' => $clearance->term_label,
                    'instructor' => [
                        'id' => $clearance->instructor->id ?? null,
                        'name' => $clearance->instructor->name ?? '—',
                        'title' => $clearance->instructor->title ?? null,
                        // The label, not the slug the column stores
                        'department' => $clearance->instructor?->department_label,
                    ],
                    'signed' => $mine->where('status', 'approved')->count(),
                    'total' => $mine->count(),
                    // Who is still to sign, in form order
                    'outstanding' => $mine->where('status', 'pending')->pluck('name')->values(),
                    // Whether this row is waiting on the person looking at it
                    'waiting_on_me' => $focusRoleIds->isEmpty()
                        ? $mine->where('status', 'pending')->isNotEmpty()
                        : $mine->whereIn('clearance_role_id', $focusRoleIds)
                            ->where('status', 'pending')->isNotEmpty(),
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

    /** Creates the faculty clearances for a term. */
    public function generate(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only an admin or registrar can generate faculty clearances.',
            ], 403);
        }

        [$schoolYear, $semester] = $this->term($request);

        if (!$semester) {
            return response()->json([
                'success' => false,
                'message' => 'Choose which semester to generate for.',
            ], 422);
        }

        $result = $this->clearance->backfillFacultyTerm($schoolYear, $semester);

        return response()->json([
            'success' => true,
            'message' => $result['clearances'] === 0 && $result['items'] === 0
                ? 'Every instructor already has a clearance for this term.'
                : "{$result['clearances']} clearance(s) and {$result['items']} signature line(s) created.",
            'data' => $result,
        ]);
    }

    /** The signed-in instructor's own clearances, newest term first. */
    public function mine(): JsonResponse
    {
        $user = Auth::user();
        $instructor = $user ? Instructor::where('user_id', $user->id)->first() : null;

        if (!$instructor) {
            return response()->json([
                'success' => false,
                'message' => 'No instructor record is linked to this account.',
            ], 404);
        }

        $clearances = Clearance::with(['items.role', 'items.approver:id,name'])
            ->where('instructor_id', $instructor->id)
            ->orderByDesc('school_year')
            ->orderBy('semester')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'instructor' => [
                    'name' => $instructor->name,
                    'title' => $instructor->title,
                    'department' => $instructor->department_label,
                ],
                'clearances' => $clearances->map(fn (Clearance $clearance) => [
                    'id' => $clearance->id,
                    'status' => $clearance->status,
                    'term_label' => $clearance->term_label,
                    'school_year' => $clearance->school_year,
                    'semester' => $clearance->semester,
                    'cleared_at' => $clearance->cleared_at?->toDateString(),
                    'items' => $clearance->items
                        ->filter(fn ($item) => $item->role?->is_active)
                        ->sortBy(fn ($item) => $item->role->sort_order)
                        ->map(fn ($item) => [
                            'id' => $item->id,
                            'role_name' => $item->role->name,
                            'is_final' => $item->role->is_final,
                            'status' => $item->status,
                            'approved_at' => $item->approved_at,
                            'approver_name' => $item->approver->name ?? null,
                            'on_behalf' => (bool) $item->on_behalf,
                        ])->values(),
                ])->values(),
            ],
        ]);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    /**
     * The term being looked at.
     *
     * Faculty clear once per semester, two to a school year, so this always
     * settles on one concrete semester.
     */
    private function term(Request $request): array
    {
        $schoolYear = trim((string) $request->input('school_year', ''));
        $semester = trim((string) $request->input('semester', ''));

        if ($schoolYear !== '' && $semester !== '') {
            return [$schoolYear, $semester];
        }

        if ($schoolYear === '') {
            $schoolYear = Clearance::forFaculty()->max('school_year')
                ?? DB::table('pre_enrolled_students')->max('school_year')
                ?? '';
        }

        if ($semester === '') {
            $semester = DB::table('clearances')
                ->whereNotNull('instructor_id')
                ->where('school_year', $schoolYear)
                ->orderBy('semester')
                ->value('semester')
                // Nothing generated yet, so offer the first semester rather
                // than leaving Generate with nothing to act on
                ?? ClearanceService::COLLEGE_TERMS[0];
        }

        return [$schoolYear, $semester];
    }

    /**
     * The terms the picker offers.
     *
     * Both semesters of every known school year, generated or not. Listing
     * only the terms that already have clearances would mean the second
     * semester never appears — and so could never be generated, because
     * Generate acts on whatever the picker has selected.
     */
    private function termOptions(): array
    {
        $counts = DB::table('clearances')
            ->whereNotNull('instructor_id')
            ->selectRaw('school_year, semester, COUNT(*) AS total')
            ->groupBy('school_year', 'semester')
            ->get()
            ->keyBy(fn ($row) => "{$row->school_year}|{$row->semester}");

        $years = $counts->pluck('school_year')
            ->merge(SchoolYear::pluck('name'))
            ->push(DB::table('pre_enrolled_students')->max('school_year'))
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        $options = [];

        foreach ($years as $year) {
            foreach (ClearanceService::COLLEGE_TERMS as $semester) {
                $options[] = [
                    'school_year' => $year,
                    'semester' => $semester,
                    'total' => (int) ($counts["{$year}|{$semester}"]->total ?? 0),
                ];
            }
        }

        return $options;
    }
}
