<?php

namespace App\Http\Controllers;

use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * The school years offered in the enrolment screens.
 *
 * Reading the list is open to any signed-in user, because every enrolment
 * form needs it. Changing it is the registrar's and admin's business.
 */
class SchoolYearController extends Controller
{
    private const EDIT_ROLES = ['Admin', 'Registrar'];

    private function denyUnlessEditor(): ?JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role, self::EDIT_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only an admin or registrar can change the school years.',
            ], 403);
        }

        return null;
    }

    /**
     * The list, newest first, with how many students are filed against each —
     * which is what tells the registrar whether a year is safe to remove.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SchoolYear::query()->newestFirst();

        if (!$request->boolean('include_inactive')) {
            $query->active();
        }

        $years = $query->get();

        $counts = DB::table('pre_enrolled_students')
            ->whereIn('school_year', $years->pluck('name'))
            ->selectRaw('school_year, COUNT(*) AS students')
            ->groupBy('school_year')
            ->pluck('students', 'school_year');

        return response()->json([
            'success' => true,
            'data' => $years->map(fn (SchoolYear $year) => [
                'id' => $year->id,
                'name' => $year->name,
                'is_active' => $year->is_active,
                'students' => (int) ($counts[$year->name] ?? 0),
            ]),
            'can' => ['manage' => in_array(Auth::user()?->role, self::EDIT_ROLES, true)],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessEditor()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:20', 'regex:/^\d{4}-\d{4}$/', 'unique:school_years,name'],
            'is_active' => 'nullable|boolean',
        ], [
            'name.regex' => 'Write the school year as 2026-2027.',
            'name.unique' => 'That school year is already on the list.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($error = $this->spanError($request->input('name'))) {
            return response()->json(['success' => false, 'message' => $error], 422);
        }

        $year = SchoolYear::create([
            'name' => $request->input('name'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => "School year {$year->name} added.",
            'data' => ['id' => $year->id, 'name' => $year->name, 'is_active' => $year->is_active],
        ], 201);
    }

    public function update(Request $request, SchoolYear $schoolYear): JsonResponse
    {
        if ($denied = $this->denyUnlessEditor()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'sometimes', 'required', 'string', 'max:20', 'regex:/^\d{4}-\d{4}$/',
                Rule::unique('school_years', 'name')->ignore($schoolYear->id),
            ],
            'is_active' => 'sometimes|boolean',
        ], [
            'name.regex' => 'Write the school year as 2026-2027.',
            'name.unique' => 'That school year is already on the list.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $newName = $request->input('name', $schoolYear->name);

        if ($newName !== $schoolYear->name) {
            if ($error = $this->spanError($newName)) {
                return response()->json(['success' => false, 'message' => $error], 422);
            }

            // Renaming a year that students are filed under would orphan their
            // records, since every table stores the year as text
            $inUse = DB::table('pre_enrolled_students')->where('school_year', $schoolYear->name)->count();

            if ($inUse > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "{$schoolYear->name} cannot be renamed — {$inUse} student record(s) are filed under it. "
                        . 'Add the new year instead and untick this one.',
                ], 422);
            }
        }

        $schoolYear->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => "School year {$schoolYear->name} updated.",
        ]);
    }

    public function destroy(SchoolYear $schoolYear): JsonResponse
    {
        if ($denied = $this->denyUnlessEditor()) {
            return $denied;
        }

        $inUse = DB::table('pre_enrolled_students')->where('school_year', $schoolYear->name)->count();

        if ($inUse > 0) {
            return response()->json([
                'success' => false,
                'message' => "{$schoolYear->name} has {$inUse} student record(s) against it. "
                    . 'Untick it to hide it from the pickers instead of removing it.',
            ], 422);
        }

        $name = $schoolYear->name;
        $schoolYear->delete();

        return response()->json(['success' => true, 'message' => "School year {$name} removed."]);
    }

    /** "2026-2027" is a year and the one after it, never a gap or a reversal. */
    private function spanError(string $name): ?string
    {
        [$from, $to] = array_map('intval', explode('-', $name, 2));

        return $to === $from + 1
            ? null
            : "A school year runs for one year — {$from}-" . ($from + 1) . ', not ' . $name . '.';
    }
}
