<?php

namespace App\Http\Controllers;

use App\Models\ClearanceRole;
use App\Models\User;
use App\Services\ClearanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Who signs which clearance line.
 *
 * Assignment is separate from a user's `role` on purpose: a signatory may be
 * an instructor, admin staff or neither, and one person may hold two lines —
 * the registrar is also the guidance counsellor. Holding any line is what
 * puts the clearance board in that person's sidebar.
 */
class ClearanceRoleController extends Controller
{
    public function __construct(private readonly ClearanceService $clearance)
    {
    }

    private function denyUnlessAdmin(): ?JsonResponse
    {
        return Auth::user()?->isAdmin()
            ? null
            : response()->json([
                'success' => false,
                'message' => 'Only an admin can change who signs a clearance line.',
            ], 403);
    }

    /** Every line with the people assigned to it. */
    public function index(): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        // Student lines first, then faculty — two forms in one table, and a
        // list that mixes them leaves the admin guessing which is which
        $roles = ClearanceRole::with(['users:id,name,email,role', 'altRole:id,name'])
            ->orderByRaw("FIELD(scope, 'student', 'faculty')")
            ->inFormOrder()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles->map(fn (ClearanceRole $role) => [
                'id' => $role->id,
                'code' => $role->code,
                'name' => $role->name,
                'description' => $role->description,
                'scope' => $role->scope,
                'scope_label' => $role->scope === ClearanceRole::SCOPE_FACULTY
                    ? 'Faculty clearance'
                    : 'Student clearance',
                // The one line another may sign in place of — the faculty
                // TESDA line, which the Registrar covers
                'alt_role_name' => $role->altRole->name ?? null,
                'is_final' => $role->is_final,
                'is_active' => $role->is_active,
                'sort_order' => $role->sort_order,
                'users' => $role->users->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ])->values(),
            ]),
        ]);
    }

    /**
     * The accounts that can be given a line, with the ones they already hold.
     *
     * Students are left out; everyone else is fair game, because a signatory
     * may be an instructor as readily as admin staff.
     */
    public function assignableUsers(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $search = trim((string) $request->input('search', ''));

        $users = User::query()
            ->where('role', '!=', 'Student')
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->with('clearanceRoles:id,code,name')
            ->orderBy('name')
            ->limit(200)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'clearance_roles' => $user->clearanceRoles->map(fn ($role) => [
                    'id' => $role->id,
                    'code' => $role->code,
                    'name' => $role->name,
                ])->values(),
            ]),
        ]);
    }

    /**
     * Creates an account for a signatory who has none, and assigns their
     * lines in the same step.
     *
     * Most people on the clearance form — the nurse, the security personnel,
     * the council officers — have no reason to exist in the system other
     * than to sign. They are made as 'Staff', which grants nothing on its
     * own, so the only thing the account can reach is the clearance board.
     */
    public function storeSignatory(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['nullable', Rule::in(UserController::ASSIGNABLE_ROLES)],
            'clearance_role_ids' => 'present|array|min:1',
            'clearance_role_ids.*' => 'integer|exists:clearance_roles,id',
        ], [
            'clearance_role_ids.min' => 'Choose at least one line for this person to sign.',
            'email.unique' => 'That email already has an account — assign their lines from the list instead.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $roleIds = collect($request->input('clearance_role_ids'))->unique();

        $user = DB::transaction(function () use ($request, $roleIds) {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
                'role' => $request->input('role') ?: 'Staff',
            ]);

            $user->clearanceRoles()->sync(
                $roleIds->mapWithKeys(fn ($id) => [$id => ['assigned_by' => Auth::id()]])->all()
            );

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => "{$user->name} can now sign {$roleIds->count()} clearance line(s).",
            'data' => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
        ], 201);
    }

    /**
     * Sets the lines one person holds, in one call.
     *
     * A whole-set replace rather than add/remove calls, so the screen cannot
     * leave someone holding a line it no longer shows.
     */
    public function syncUser(Request $request, User $user): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'clearance_role_ids' => 'present|array',
            'clearance_role_ids.*' => 'integer|exists:clearance_roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($user->role === 'Student') {
            return response()->json([
                'success' => false,
                'message' => 'A student account cannot sign a clearance line.',
            ], 422);
        }

        $roleIds = collect($request->input('clearance_role_ids'))->unique()->values();

        $user->clearanceRoles()->sync(
            $roleIds->mapWithKeys(fn ($id) => [$id => ['assigned_by' => Auth::id()]])->all()
        );

        $this->clearance->forgetHeldRoles($user->id);

        return response()->json([
            'success' => true,
            'message' => $roleIds->isEmpty()
                ? "{$user->name} no longer signs any clearance line."
                : "{$user->name} now signs {$roleIds->count()} clearance line(s).",
            'data' => ['clearance_role_ids' => $roleIds],
        ]);
    }

    /** Sets the people on one line, from the roles screen. */
    public function syncRole(Request $request, ClearanceRole $clearanceRole): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'present|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $userIds = collect($request->input('user_ids'))->unique();

        // A student account must never end up holding a signature line
        $students = User::whereIn('id', $userIds)->where('role', 'Student')->pluck('name');

        if ($students->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Student accounts cannot sign a clearance line: ' . $students->implode(', ') . '.',
            ], 422);
        }

        $clearanceRole->users()->sync(
            $userIds->mapWithKeys(fn ($id) => [$id => ['assigned_by' => Auth::id()]])->all()
        );

        $this->clearance->forgetHeldRoles();

        return response()->json([
            'success' => true,
            'message' => "{$clearanceRole->name} is now signed by {$userIds->count()} person(s).",
        ]);
    }

    /**
     * Retires or restores a line.
     *
     * Retiring leaves the rows already signed against it alone; they simply
     * stop counting towards whether a student is cleared.
     */
    public function update(Request $request, ClearanceRole $clearanceRole): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($clearanceRole->is_final && $request->has('is_active') && !$request->boolean('is_active')) {
            return response()->json([
                'success' => false,
                'message' => 'The cashier signs last on every clearance and cannot be retired.',
            ], 422);
        }

        $clearanceRole->update($validator->validated());

        // Retiring a line can complete clearances that were only waiting on it
        if ($request->has('is_active')) {
            $this->recomputeAffected($clearanceRole);
        }

        return response()->json(['success' => true, 'message' => "{$clearanceRole->name} updated."]);
    }

    /** Adds a line that is not on the printed form. */
    public function store(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Which form the line belongs on. Defaults to the student's, which is
        // what every line was before faculty clearance existed.
        $scope = $request->input('scope') === ClearanceRole::SCOPE_FACULTY
            ? ClearanceRole::SCOPE_FACULTY
            : ClearanceRole::SCOPE_STUDENT;

        $role = ClearanceRole::create([
            'code' => $this->codeFor($request->input('name')),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'scope' => $scope,
            'is_final' => false,
            'sort_order' => (int) ClearanceRole::forScope($scope)->max('sort_order') + 1,
            'is_active' => true,
        ]);

        // The new line has to appear on clearances that already exist, not
        // only on next term's — but only on the form it belongs to. The two
        // share this table, so a student line must never land on a faculty
        // clearance, or the instructor could never finish it.
        $subjectColumn = $scope === ClearanceRole::SCOPE_FACULTY
            ? 'instructor_id'
            : 'pre_enrolled_student_id';

        $added = DB::affectingStatement(
            "INSERT INTO clearance_items
                (clearance_id, clearance_role_id, status, on_behalf, created_at, updated_at)
             SELECT c.id, ?, 'pending', 0, ?, ?
             FROM clearances c
             WHERE c.{$subjectColumn} IS NOT NULL
               AND c.status != 'cleared'",
            [$role->id, now(), now()]
        );

        return response()->json([
            'success' => true,
            'message' => "{$role->name} added and applied to {$added} clearance(s) still in progress.",
            'data' => ['id' => $role->id],
        ], 201);
    }

    /** Settles clearances whose outcome a retired or restored line changes. */
    private function recomputeAffected(ClearanceRole $role): void
    {
        DB::table('clearance_items')
            ->where('clearance_role_id', $role->id)
            ->select('clearance_id')
            ->distinct()
            ->orderBy('clearance_id')
            ->chunk(500, function ($rows) {
                $this->clearance->recomputeMany($rows->pluck('clearance_id')->all());
            });
    }

    private function codeFor(string $name): string
    {
        $base = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($name)), '_') ?: 'line';
        $code = $base;
        $suffix = 2;

        while (ClearanceRole::where('code', $code)->exists()) {
            $code = $base . '_' . $suffix++;
        }

        return $code;
    }
}
