<?php

namespace App\Services;

use App\Exceptions\ClearanceException;
use App\Jobs\SendClearanceClearedEmails;
use App\Models\Clearance;
use App\Models\ClearanceItem;
use App\Models\ClearanceRole;
use App\Models\EnrollmentHistory;
use App\Models\Grade;
use App\Models\Instructor;
use App\Models\PreEnrolledStudent;
use App\Models\User;
use App\Support\Deferred;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Every rule about clearance lives here.
 *
 * Controllers decide who is asking and what to answer with; this decides
 * what is allowed. Keeping it in one place is what stops the permission
 * check drifting between the single-approve path, the bulk path and the
 * scanner, which is exactly where a bypass would otherwise appear.
 */
class ClearanceService
{
    /** Terms that carry a clearance. Summer deliberately does not. */
    public const COLLEGE_TERMS = ['1st Semester', '2nd Semester'];

    /** Role ids per user, memoised for the life of this instance only. */
    private array $heldRoles = [];

    // ───────────────────────────── terms ─────────────────────────────

    /**
     * The clearance term for a student's current enrolment, or null when the
     * term does not carry one — summer, or a missing school year.
     *
     * Senior High clears once for the whole year, so its semester collapses
     * to a single sentinel and both semesters resolve to the same clearance.
     */
    public function termFor(PreEnrolledStudent $student): ?array
    {
        return $this->termOf($student, $student->school_year, $student->semester);
    }

    /** The clearance term covering a given school year and semester. */
    public function termOf(PreEnrolledStudent $student, ?string $schoolYear, ?string $semester): ?array
    {
        $schoolYear = trim((string) $schoolYear);

        if ($schoolYear === '') {
            return null;
        }

        if ($student->isSeniorHigh()) {
            return ['school_year' => $schoolYear, 'semester' => Clearance::WHOLE_YEAR];
        }

        return in_array($semester, self::COLLEGE_TERMS, true)
            ? ['school_year' => $schoolYear, 'semester' => $semester]
            : null;
    }

    // ───────────────────────────── creation ─────────────────────────────

    /**
     * The student's clearance for their current term, created if missing.
     *
     * Safe to call repeatedly: the unique index on (student, year, term) is
     * what makes two simultaneous enrolments settle on one row rather than
     * two, and the item rows are topped up rather than duplicated.
     */
    public function ensureFor(PreEnrolledStudent $student): ?Clearance
    {
        $term = $this->termFor($student);

        if (!$term) {
            return null;
        }

        return DB::transaction(function () use ($student, $term) {
            $clearance = Clearance::firstOrCreate(
                [
                    'pre_enrolled_student_id' => $student->id,
                    'school_year' => $term['school_year'],
                    'semester' => $term['semester'],
                ],
                ['year_level' => $student->year, 'status' => 'pending']
            );

            $this->syncItems($clearance);

            return $clearance;
        });
    }

    /**
     * Gives the clearance one row per active signature line.
     *
     * Called on creation and again whenever a role is added later, so a new
     * signatory appears on clearances that already exist instead of only on
     * next term's.
     */
    public function syncItems(Clearance $clearance): int
    {
        // Only the lines on this clearance's own form — a student's sixteen
        // and a faculty member's eight share one table
        $roleIds = ClearanceRole::active()->forScope($clearance->scope())->pluck('id');
        $existing = $clearance->items()->pluck('clearance_role_id');
        $missing = $roleIds->diff($existing);

        if ($missing->isEmpty()) {
            return 0;
        }

        $now = Carbon::now();

        ClearanceItem::insert(
            $missing->map(fn ($roleId) => [
                'clearance_id' => $clearance->id,
                'clearance_role_id' => $roleId,
                'status' => 'pending',
                'on_behalf' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all()
        );

        // A clearance that was complete is not complete any more
        $this->recompute($clearance->fresh());

        return $missing->count();
    }

    /**
     * Creates the clearances for everyone enrolled in a term.
     *
     * Written as set operations rather than a loop over students: at eight
     * hundred students and sixteen roles this is three statements instead of
     * thirteen thousand.
     */
    public function backfillTerm(string $schoolYear, ?string $semester = null): array
    {
        // Students only. Unscoped, this hands every student clearance the
        // faculty lines as well — the two share this table.
        $roleIds = ClearanceRole::active()->forStudents()->pluck('id');

        if ($roleIds->isEmpty()) {
            return ['clearances' => 0, 'items' => 0];
        }

        $students = PreEnrolledStudent::with('course.program')
            ->where('enrollment_status', 'enrolled')
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->get();

        $now = Carbon::now();
        $created = 0;

        // One row per student per term, skipping any that already exist
        $rows = $students
            ->map(function (PreEnrolledStudent $student) use ($now) {
                $term = $this->termFor($student);

                return $term ? [
                    'pre_enrolled_student_id' => $student->id,
                    'school_year' => $term['school_year'],
                    'semester' => $term['semester'],
                    'year_level' => $student->year,
                    'status' => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ] : null;
            })
            ->filter()
            // Senior High students enrolled in both semesters resolve to the
            // same whole-year clearance, so the pair collapses to one row
            ->unique(fn ($row) => $row['pre_enrolled_student_id'] . '|' . $row['semester'])
            ->values();

        foreach ($rows->chunk(500) as $chunk) {
            $created += DB::table('clearances')->insertOrIgnore($chunk->all());
        }

        // Item rows for every clearance that is short of one, in a single
        // insert..select per role rather than per clearance
        $items = 0;

        foreach ($roleIds as $roleId) {
            // affectingStatement, not insert: insert() answers with a bool,
            // which would have counted statements rather than rows
            $items += DB::affectingStatement(
                'INSERT INTO clearance_items
                    (clearance_id, clearance_role_id, status, on_behalf, created_at, updated_at)
                 SELECT c.id, ?, \'pending\', 0, ?, ?
                 FROM clearances c
                 WHERE c.pre_enrolled_student_id IS NOT NULL
                   AND c.school_year = ?
                   AND NOT EXISTS (
                       SELECT 1 FROM clearance_items i
                       WHERE i.clearance_id = c.id AND i.clearance_role_id = ?
                   )',
                // Students only: the faculty clearances for the same year
                // share this table and must not collect a student's lines
                [$roleId, $now, $now, $schoolYear, $roleId]
            );
        }

        return ['clearances' => $created, 'items' => $items];
    }

    /**
     * Drops clearances for terms the student turns out never to have been in.
     *
     * Correcting a mistyped school year leaves behind the clearance the typo
     * created, and the registrar then finds the student on a board for a term
     * they never enrolled in.
     *
     * Two conditions keep this away from a genuine past term:
     *
     *  - nobody has signed any of its lines, and
     *  - the student has no enrolment history for it.
     *
     * A term actually sat always leaves a history row behind when the student
     * moves on from it, so the pair tells a typo apart from a semester that
     * simply went unsigned. Returns how many were dropped.
     */
    public function forgetUnusedTerms(PreEnrolledStudent $student): int
    {
        $current = $this->termFor($student);

        $candidates = Clearance::where('pre_enrolled_student_id', $student->id)
            ->when($current, fn ($q) => $q->whereNot(fn ($w) => $w
                ->where('school_year', $current['school_year'])
                ->where('semester', $current['semester'])))
            // Never a clearance anyone has put their name to
            ->whereDoesntHave('items', fn ($q) => $q->where('status', 'approved'))
            ->get();

        if ($candidates->isEmpty()) {
            return 0;
        }

        $stale = $candidates->filter(function (Clearance $clearance) use ($student) {
            // Senior High clears once for the year, so its clearance answers
            // to either semester's history row
            $semesters = $clearance->semester === Clearance::WHOLE_YEAR
                ? self::COLLEGE_TERMS
                : [$clearance->semester];

            return !EnrollmentHistory::where('pre_enrolled_student_id', $student->id)
                ->where('school_year', $clearance->school_year)
                ->whereIn('semester', $semesters)
                ->exists();
        });

        if ($stale->isEmpty()) {
            return 0;
        }

        // The items go with it through the cascade on clearance_id
        Clearance::whereIn('id', $stale->pluck('id'))->delete();

        return $stale->count();
    }

    // ───────────────────────────── faculty ─────────────────────────────

    /**
     * An instructor's clearance for one term, created if missing.
     *
     * Faculty take one per semester, two to a school year — no whole-year
     * collapse, because the rule that gives Senior High one is about the
     * student's enrolment, not about the term itself.
     */
    public function ensureForInstructor(Instructor $instructor, string $schoolYear, string $semester): ?Clearance
    {
        $schoolYear = trim($schoolYear);
        $semester = trim($semester);

        if ($schoolYear === '' || !in_array($semester, self::COLLEGE_TERMS, true)) {
            return null;
        }

        return DB::transaction(function () use ($instructor, $schoolYear, $semester) {
            $clearance = Clearance::firstOrCreate(
                [
                    'instructor_id' => $instructor->id,
                    'school_year' => $schoolYear,
                    'semester' => $semester,
                ],
                ['status' => 'pending']
            );

            $this->syncItems($clearance);

            return $clearance;
        });
    }

    /**
     * Creates the faculty clearances for a term.
     *
     * Set operations rather than a loop, for the same reason the student
     * backfill is: forty instructors and eight lines is two statements
     * instead of three hundred and twenty.
     */
    public function backfillFacultyTerm(string $schoolYear, string $semester): array
    {
        $roleIds = ClearanceRole::active()->forFaculty()->pluck('id');

        if ($roleIds->isEmpty() || !in_array($semester, self::COLLEGE_TERMS, true)) {
            return ['clearances' => 0, 'items' => 0];
        }

        $now = Carbon::now();

        $rows = Instructor::where('status', 'Active')
            ->orderBy('id')
            ->get()
            ->map(fn (Instructor $instructor) => [
                'instructor_id' => $instructor->id,
                'school_year' => $schoolYear,
                'semester' => $semester,
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

        $created = 0;

        foreach ($rows->chunk(500) as $chunk) {
            $created += DB::table('clearances')->insertOrIgnore($chunk->all());
        }

        $items = 0;

        foreach ($roleIds as $roleId) {
            $items += DB::affectingStatement(
                'INSERT INTO clearance_items
                    (clearance_id, clearance_role_id, status, on_behalf, created_at, updated_at)
                 SELECT c.id, ?, \'pending\', 0, ?, ?
                 FROM clearances c
                 WHERE c.instructor_id IS NOT NULL
                   AND c.school_year = ? AND c.semester = ?
                   AND NOT EXISTS (
                       SELECT 1 FROM clearance_items i
                       WHERE i.clearance_id = c.id AND i.clearance_role_id = ?
                   )',
                [$roleId, $now, $now, $schoolYear, $semester, $roleId]
            );
        }

        return ['clearances' => $created, 'items' => $items];
    }

    // ───────────────────────────── approving ─────────────────────────────

    /** Whether this user may sign this line. The admin may sign any of them. */
    public function canSign(User $user, ClearanceRole $role): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $held = $this->heldRoleIds($user);

        return $held->contains($role->id)
            // A line that names a stand-in. Only the faculty TESDA In-Charge
            // line does, which the Registrar may sign in their place — and
            // one way only, so holding TESDA does not let you sign Registrar.
            || ($role->alt_role_id !== null && $held->contains($role->alt_role_id));
    }

    /**
     * The role ids a user holds.
     *
     * Memoised per instance, not statically: the service is resolved once per
     * request, so this saves the repeat query during a bulk approval without
     * the cache outliving the request — which under a long-running worker
     * would otherwise answer with a stale set after an assignment changed.
     */
    public function heldRoleIds(User $user): Collection
    {
        return $this->heldRoles[$user->id] ??= $user->clearanceRoles()->pluck('clearance_roles.id');
    }

    /** Drops the memo after an assignment changes within the same request. */
    public function forgetHeldRoles(?int $userId = null): void
    {
        if ($userId === null) {
            $this->heldRoles = [];

            return;
        }

        unset($this->heldRoles[$userId]);
    }

    /**
     * Signs one line.
     *
     * Both the permission and the cashier gate are checked here, so the
     * single, bulk and scanned paths cannot disagree about what is allowed.
     */
    public function approve(ClearanceItem $item, User $user, ?string $remarks = null): ClearanceItem
    {
        $item->loadMissing('role', 'clearance');

        if (!$item->role || !$item->role->is_active) {
            throw new ClearanceException('That signature line is no longer in use.');
        }

        if (!$this->canSign($user, $item->role)) {
            throw ClearanceException::forbidden(
                "You are not assigned to sign the {$item->role->name} line."
            );
        }

        if ($item->isApproved()) {
            return $item;
        }

        if ($item->role->is_final) {
            $outstanding = $this->outstandingRoleNames($item->clearance, $item->id);

            if ($outstanding->isNotEmpty()) {
                throw new ClearanceException(
                    'The cashier signs last. Still waiting on: ' . $outstanding->implode(', ') . '.'
                );
            }
        }

        DB::transaction(function () use ($item, $user, $remarks) {
            $item->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => Carbon::now(),
                // An admin signing a line they do not personally hold
                'on_behalf' => $user->isAdmin() && !$this->heldRoleIds($user)->contains($item->clearance_role_id),
                'remarks' => $remarks ?: $item->remarks,
            ]);

            $this->recompute($item->clearance);
        });

        return $item->fresh(['role', 'approver']);
    }

    /**
     * Signs one line for many students at once.
     *
     * Permission is checked once for the role, then the rows are written in a
     * single statement — but the cashier's line still goes one at a time,
     * because each student's gate depends on that student's other lines.
     */
    public function bulkApprove(array $clearanceIds, ClearanceRole $role, User $user, ?string $remarks = null): array
    {
        if (!$this->canSign($user, $role)) {
            throw ClearanceException::forbidden("You are not assigned to sign the {$role->name} line.");
        }

        $items = ClearanceItem::with('clearance')
            ->whereIn('clearance_id', $clearanceIds)
            ->where('clearance_role_id', $role->id)
            ->pending()
            ->get();

        if ($items->isEmpty()) {
            return ['approved' => 0, 'skipped' => [], 'cleared' => 0];
        }

        $skipped = [];
        $approvable = $items;

        if ($role->is_final) {
            [$approvable, $blocked] = $items->partition(
                fn (ClearanceItem $item) => $this->outstandingRoleNames($item->clearance, $item->id)->isEmpty()
            );

            $skipped = $blocked
                ->map(fn (ClearanceItem $item) => $item->clearance_id)
                ->values()
                ->all();
        }

        if ($approvable->isEmpty()) {
            return ['approved' => 0, 'skipped' => $skipped, 'cleared' => 0];
        }

        $onBehalf = $user->isAdmin() && !$this->heldRoleIds($user)->contains($role->id);

        $cleared = DB::transaction(function () use ($approvable, $user, $remarks, $onBehalf) {
            ClearanceItem::whereIn('id', $approvable->pluck('id'))->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => Carbon::now(),
                'on_behalf' => $onBehalf,
                'remarks' => $remarks,
                'updated_at' => Carbon::now(),
            ]);

            return $this->recomputeMany($approvable->pluck('clearance_id')->unique()->all());
        });

        return ['approved' => $approvable->count(), 'skipped' => $skipped, 'cleared' => $cleared];
    }

    /**
     * The admin's override: signs every outstanding line on these clearances.
     *
     * The way to clear a student when the people who should sign are not
     * around. Every row it writes is marked as a stand-in signature.
     *
     * `$notify` false signs them quietly — for bringing a finished term's
     * records up to date, where telling several hundred students they have
     * just been cleared would be both untrue and a mailbox full of noise.
     * Admin only, because approveAll already is.
     */
    public function approveAll(array $clearanceIds, User $user, ?string $remarks = null, bool $notify = true): array
    {
        if (!$user->isAdmin()) {
            throw ClearanceException::forbidden('Only an admin can sign every line at once.');
        }

        $held = $this->heldRoleIds($user);

        $items = ClearanceItem::whereIn('clearance_id', $clearanceIds)
            ->pending()
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->get();

        if ($items->isEmpty()) {
            return ['approved' => 0, 'cleared' => 0];
        }

        $cleared = DB::transaction(function () use ($items, $user, $remarks, $held, $clearanceIds, $notify) {
            // Grouped so the stand-in flag stays honest for the lines the
            // admin does personally hold
            foreach ($items->groupBy('clearance_role_id') as $roleId => $group) {
                ClearanceItem::whereIn('id', $group->pluck('id'))->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => Carbon::now(),
                    'on_behalf' => !$held->contains($roleId),
                    'remarks' => $remarks,
                    'updated_at' => Carbon::now(),
                ]);
            }

            return $this->recomputeMany($clearanceIds, $notify);
        });

        return ['approved' => $items->count(), 'cleared' => $cleared];
    }

    /**
     * Lines still unsigned on a clearance, by name, for the message.
     *
     * Every column is qualified: `id` and `status` exist on both tables, so
     * an unqualified name is rejected once the join is in play.
     */
    public function outstandingRoleNames(Clearance $clearance, ?int $exceptItemId = null): Collection
    {
        return DB::table('clearance_items')
            ->join('clearance_roles', 'clearance_roles.id', '=', 'clearance_items.clearance_role_id')
            ->where('clearance_items.clearance_id', $clearance->id)
            ->where('clearance_items.status', 'pending')
            ->when($exceptItemId, fn ($q) => $q->where('clearance_items.id', '!=', $exceptItemId))
            ->where('clearance_roles.is_active', true)
            ->orderBy('clearance_roles.sort_order')
            ->pluck('clearance_roles.name');
    }

    // ───────────────────────────── status ─────────────────────────────

    /** Settles one clearance's status and lifts any grade holds it caused. */
    public function recompute(Clearance $clearance): bool
    {
        $pending = ClearanceItem::where('clearance_id', $clearance->id)
            ->pending()
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->exists();

        $status = $pending ? 'pending' : 'cleared';
        $wasCleared = $clearance->status === 'cleared';

        if ($clearance->status !== $status) {
            $clearance->update([
                'status' => $status,
                'cleared_at' => $status === 'cleared' ? Carbon::now() : null,
            ]);
        }

        if ($status === 'cleared') {
            $released = $this->releaseHolds($clearance);

            // Only a clearance that has just come good is announced. This
            // method runs on every signature, so recomputing one that was
            // already cleared must stay silent.
            if (!$wasCleared) {
                $this->announceCleared([$clearance->id => $released]);
            }

            return true;
        }

        return false;
    }

    /** The same for a batch, in two statements rather than two per student. */
    public function recomputeMany(array $clearanceIds, bool $notify = true): int
    {
        if (!$clearanceIds) {
            return 0;
        }

        $stillPending = ClearanceItem::whereIn('clearance_id', $clearanceIds)
            ->pending()
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->distinct()
            ->pluck('clearance_id');

        $nowCleared = collect($clearanceIds)->diff($stillPending)->values();

        if ($nowCleared->isNotEmpty()) {
            // Read before the write: these are the ones that were not cleared
            // a moment ago, and so the only ones whose student has not already
            // been told. The rest are simply being recomputed.
            $transitioned = Clearance::whereIn('id', $nowCleared)
                ->where('status', '!=', 'cleared')
                ->pluck('id');

            Clearance::whereIn('id', $nowCleared)
                ->where('status', '!=', 'cleared')
                ->update(['status' => 'cleared', 'cleared_at' => Carbon::now()]);

            $released = [];

            Clearance::with('student')->whereIn('id', $nowCleared)
                ->get()
                ->each(function (Clearance $clearance) use (&$released) {
                    $released[$clearance->id] = $this->releaseHolds($clearance);
                });

            $this->announceCleared(
                $transitioned->mapWithKeys(fn ($id) => [$id => $released[$id] ?? 0])->all(),
                $notify
            );
        }

        if ($stillPending->isNotEmpty()) {
            Clearance::whereIn('id', $stillPending)
                ->where('status', '!=', 'pending')
                ->update(['status' => 'pending', 'cleared_at' => null]);
        }

        return $nowCleared->count();
    }

    /**
     * Tells the students whose clearance has just come through.
     *
     * @param  array<int, int>  $releasedByClearance  clearance id => grades taken off hold
     * @param  bool  $notify  false signs them quietly, and permanently
     */
    private function announceCleared(array $releasedByClearance, bool $notify = true): void
    {
        if (!$releasedByClearance) {
            return;
        }

        // Signed quietly, and stamped as handled rather than merely skipped:
        // the row then reads "deliberately not told" instead of "not told
        // yet", so anything that later walks these ids — a retry, a resend —
        // leaves them alone.
        if (!$notify) {
            Clearance::whereIn('id', array_keys($releasedByClearance))
                ->whereNull('cleared_notified_at')
                ->update(['cleared_notified_at' => Carbon::now()]);

            return;
        }

        // Off the request either way — the job re-reads each clearance before
        // sending, so one dispatched from a transaction that later rolls back
        // finds nothing to do.
        Deferred::dispatch(
            new SendClearanceClearedEmails(array_keys($releasedByClearance), $releasedByClearance)
        );
    }

    // ───────────────────────────── grades ─────────────────────────────

    /**
     * Whether a grade for this term has to be held back.
     *
     * Terms that carry no clearance — summer — never hold, so grading is
     * untouched where the rule does not apply.
     */
    public function isClearedFor(PreEnrolledStudent $student, ?string $schoolYear, ?string $semester): bool
    {
        $term = $this->termOf($student, $schoolYear, $semester);

        if (!$term) {
            return true;
        }

        return Clearance::where('pre_enrolled_student_id', $student->id)
            ->where('school_year', $term['school_year'])
            ->where('semester', $term['semester'])
            ->where('status', 'cleared')
            ->exists();
    }

    /**
     * Puts a finalised grade on hold at INC until the student is cleared.
     *
     * The result the grade actually earned is kept in `held_status`, so
     * lifting the hold restores it exactly rather than recomputing from
     * marks that may have been edited in the meantime.
     */
    public function holdGrade(Grade $grade, string $earnedStatus): void
    {
        $grade->forceFill([
            'status' => 'INC',
            'clearance_hold' => true,
            'held_status' => $earnedStatus,
        ]);
    }

    /**
     * Lifts the holds a clearance was blocking, restoring each grade's own
     * result. Returns how many were released.
     */
    public function releaseHolds(Clearance $clearance): int
    {
        $student = $clearance->student;

        if (!$student) {
            return 0;
        }

        $semesters = $clearance->semester === Clearance::WHOLE_YEAR
            ? self::COLLEGE_TERMS   // a Senior High year covers both terms' grades
            : [$clearance->semester];

        $released = 0;

        Grade::where('pre_enrolled_student_id', $student->id)
            ->where('school_year', $clearance->school_year)
            ->whereIn('semester', $semesters)
            ->where('clearance_hold', true)
            ->get()
            ->each(function (Grade $grade) use (&$released) {
                $grade->update([
                    'status' => $grade->held_status ?: 'Passed',
                    'clearance_hold' => false,
                    'held_status' => null,
                ]);
                $released++;
            });

        return $released;
    }
}
