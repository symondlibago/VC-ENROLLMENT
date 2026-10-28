<?php

namespace App\Http\Controllers;

use App\Models\IdCardIssuance;
use App\Models\IdSupplyDelivery;
use App\Models\IdSupplyIssuance;
use App\Models\IdSupplyItem;
use App\Models\PreEnrolledStudent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Student ID monitoring (printing, releasing, replacements and supplies).
 *
 * The board is read a school year at a time. Each card a student is given is
 * its own record, so a lost ID leaves its history behind instead of being
 * written over, and the year's counts never need to be reset to start again.
 *
 * Every figure comes from a grouped aggregate rather than from walking the
 * rows, and the student list is paginated at the database, so the page stays
 * the same speed whether the school has eight hundred students or eight
 * thousand.
 */
class IdReleasingController extends Controller
{
    /** Removing records is the admin's call; the desk can do the rest. */
    private function isAdmin(): bool
    {
        return Auth::user()?->role === 'Admin';
    }

    private function denyUnlessAdmin(): ?JsonResponse
    {
        return $this->isAdmin()
            ? null
            : response()->json(['success' => false, 'message' => 'Only an admin can remove a record.'], 403);
    }

    // ───────────────────────────── the board ─────────────────────────────

    /** Headline counts for a school year, plus what the filters can offer. */
    public function overview(Request $request): JsonResponse
    {
        $schoolYear = $this->schoolYear($request);
        $years = $this->schoolYears();

        $enrolled = $this->enrolledQuery($schoolYear)->count();

        // One grouped row per status, whatever the number of cards
        $byStatus = DB::table('id_card_issuances')
            ->where('school_year', $schoolYear)
            ->whereIn('status', ['pending', 'printed', 'released', 'lost'])
            ->selectRaw('status, COUNT(*) AS cards, COUNT(DISTINCT pre_enrolled_student_id) AS students')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $released = (int) ($byStatus['released']->students ?? 0);
        $printed = (int) ($byStatus['printed']->students ?? 0);
        $lost = (int) ($byStatus['lost']->cards ?? 0);

        // A student is only waiting if they have no live card at all this year
        $withLiveCard = DB::table('id_card_issuances')
            ->where('school_year', $schoolYear)
            ->whereIn('status', ['pending', 'printed', 'released'])
            ->distinct()
            ->count('pre_enrolled_student_id');

        $replacements = DB::table('id_card_issuances')
            ->where('school_year', $schoolYear)
            ->where('sequence', '>', 1)
            ->count();

        $fees = DB::table('id_card_issuances')
            ->where('school_year', $schoolYear)
            ->sum('fee');

        return response()->json([
            'success' => true,
            'school_year' => $schoolYear,
            'school_years' => $years,
            'stats' => [
                'enrolled' => $enrolled,
                'awaiting_print' => max($enrolled - $withLiveCard, 0),
                'printed' => $printed,
                'released' => $released,
                'lost' => $lost,
                'replacements' => $replacements,
                'fees_collected' => round((float) $fees, 2),
                // Of the students enrolled this year, the share holding a card
                'release_rate' => $enrolled > 0 ? round($released / $enrolled * 100, 1) : 0.0,
            ],
            'supplies' => $this->supplySummary($schoolYear),
            'courses' => $this->courseOptions($schoolYear),
            'year_levels' => $this->yearLevelOptions($schoolYear),
            'can' => ['delete' => $this->isAdmin()],
            'role' => Auth::user()?->role,
        ]);
    }

    /**
     * The releasing board — one row per enrolled student with the card they
     * currently hold for the year being looked at.
     */
    public function students(Request $request): JsonResponse
    {
        $schoolYear = $this->schoolYear($request);
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', 'all');

        $query = $this->enrolledQuery($schoolYear)
            ->with('course:id,course_code,course_name')
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('student_id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT(last_name, ', ', first_name) like ?", ["%{$search}%"]);
            }))
            ->when($request->filled('course_id'), fn ($q) => $q->where('course_id', $request->input('course_id')))
            ->when($request->filled('year_level'), fn ($q) => $q->where('year', $request->input('year_level')));

        // Status lives on the card, not the student, so it filters by whether a
        // matching card exists for the year — and "awaiting print" is the
        // absence of one rather than a value to match.
        $query = $this->applyStatusFilter($query, $status, $schoolYear);

        $page = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(min((int) $request->input('per_page', 24), 100));

        $students = collect($page->items());
        $cards = $this->cardsFor($students->pluck('id'), $schoolYear);

        return response()->json([
            'success' => true,
            'data' => $students->map(function (PreEnrolledStudent $student) use ($cards) {
                $history = $cards->get($student->id, collect());
                $current = $history->first(); // newest live card, see cardsFor()

                return [
                    'id' => $student->id,
                    'student_id_number' => $student->student_id_number,
                    'name' => $student->getFullNameAttribute(),
                    'course' => $student->course->course_code ?? null,
                    'courseName' => $student->course->course_name ?? 'N/A',
                    'year_level' => $student->year,
                    'id_photo_url' => $student->id_photo ? Storage::disk('s3')->url($student->id_photo) : null,
                    'signature_url' => $student->signature ? Storage::disk('s3')->url($student->signature) : null,
                    'emergency_contact_name' => $student->emergency_contact_name,
                    'emergency_contact_number' => $student->emergency_contact_number,
                    'emergency_contact_address' => $student->emergency_contact_address,
                    'card' => $current ? $this->cardPayload($current) : null,
                    'cards_issued' => $history->count(),
                    'has_lost' => $history->contains(fn ($card) => $card->status === 'lost'),
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

    /** Every card a student has ever been given, newest year first. */
    public function history(PreEnrolledStudent $student): JsonResponse
    {
        $cards = IdCardIssuance::where('pre_enrolled_student_id', $student->id)
            ->with(['releaser:id,name', 'printer:id,name', 'supplyIssuances.item:id,code,name'])
            ->orderByDesc('school_year')
            ->orderByDesc('sequence')
            ->get();

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'name' => $student->getFullNameAttribute(),
                'student_id_number' => $student->student_id_number,
            ],
            'data' => $cards->map(fn (IdCardIssuance $card) => $this->cardPayload($card) + [
                'released_by_name' => $card->releaser->name ?? null,
                'printed_by_name' => $card->printer->name ?? null,
                'supplies' => $card->supplyIssuances->map(fn ($supply) => [
                    'name' => $supply->item->name ?? null,
                    'quantity' => $supply->quantity,
                ])->values(),
            ]),
        ]);
    }

    // ──────────────────────────── card actions ────────────────────────────

    /**
     * Mark cards printed. A student with no card yet gets their first one here,
     * which is what makes the board work without seeding a row per student.
     */
    public function markPrinted(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:pre_enrolled_students,id',
            'school_year' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $schoolYear = $this->schoolYear($request);
        $studentIds = array_values(array_unique($request->input('student_ids')));
        $now = Carbon::now();

        $touched = DB::transaction(function () use ($studentIds, $schoolYear, $now) {
            $existing = IdCardIssuance::where('school_year', $schoolYear)
                ->whereIn('pre_enrolled_student_id', $studentIds)
                ->whereIn('status', ['pending', 'printed', 'released'])
                ->get()
                ->groupBy('pre_enrolled_student_id');

            $count = 0;

            foreach ($studentIds as $studentId) {
                $cards = $existing->get($studentId, collect());
                $live = $cards->sortByDesc('sequence')->first();

                if (!$live) {
                    // No card this year yet — this is the student's first
                    IdCardIssuance::create([
                        'pre_enrolled_student_id' => $studentId,
                        'school_year' => $schoolYear,
                        'sequence' => $this->nextSequence($studentId, $schoolYear),
                        'reason' => 'initial',
                        'status' => 'printed',
                        'printed_at' => $now,
                        'printed_by' => Auth::id(),
                        'recorded_by' => Auth::id(),
                    ]);
                    $count++;
                    continue;
                }

                // Already printed or released — leave the dates alone
                if ($live->status !== 'pending') {
                    continue;
                }

                $live->update([
                    'status' => 'printed',
                    'printed_at' => $live->printed_at ?: $now,
                    'printed_by' => Auth::id(),
                ]);
                $count++;
            }

            $this->syncStudentColumns($studentIds, $schoolYear);

            return $count;
        });

        return response()->json([
            'success' => true,
            'message' => $touched === 0
                ? 'Those IDs were already printed.'
                : $touched . ' ' . ($touched === 1 ? 'ID' : 'IDs') . ' marked as printed.',
            'updated' => $touched,
        ]);
    }

    /**
     * Hand the cards over. The sling and holder that go out with them are
     * recorded against the card, which is what keeps the stock count honest.
     */
    public function markReleased(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:pre_enrolled_students,id',
            'school_year' => 'nullable|string|max:20',
            'received_by' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:1000',
            'supplies' => 'nullable|array',
            'supplies.*.id_supply_item_id' => 'required|exists:id_supply_items,id',
            'supplies.*.quantity' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $schoolYear = $this->schoolYear($request);
        $studentIds = array_values(array_unique($request->input('student_ids')));
        $now = Carbon::now();

        // Blank rows are fine in the form; a line of nothing is not stock
        $supplies = collect($request->input('supplies', []))
            ->filter(fn ($line) => (int) $line['quantity'] > 0)
            ->values();

        $released = DB::transaction(function () use ($studentIds, $schoolYear, $now, $request, $supplies) {
            $existing = IdCardIssuance::where('school_year', $schoolYear)
                ->whereIn('pre_enrolled_student_id', $studentIds)
                ->whereIn('status', ['pending', 'printed', 'released'])
                ->get()
                ->groupBy('pre_enrolled_student_id');

            $count = 0;

            foreach ($studentIds as $studentId) {
                $live = $existing->get($studentId, collect())->sortByDesc('sequence')->first();

                if (!$live) {
                    // Released without ever being marked printed — it plainly
                    // was printed, so both dates land on the same record
                    $live = IdCardIssuance::create([
                        'pre_enrolled_student_id' => $studentId,
                        'school_year' => $schoolYear,
                        'sequence' => $this->nextSequence($studentId, $schoolYear),
                        'reason' => 'initial',
                        'status' => 'pending',
                        'recorded_by' => Auth::id(),
                    ]);
                }

                if ($live->status === 'released') {
                    continue;
                }

                $live->update([
                    'status' => 'released',
                    'printed_at' => $live->printed_at ?: $now,
                    'released_at' => $now,
                    'released_by' => Auth::id(),
                    'received_by' => $request->input('received_by') ?: $live->received_by,
                    'remarks' => $request->input('remarks') ?: $live->remarks,
                ]);

                foreach ($supplies as $line) {
                    IdSupplyIssuance::create([
                        'id_supply_item_id' => $line['id_supply_item_id'],
                        'id_card_issuance_id' => $live->id,
                        'pre_enrolled_student_id' => $studentId,
                        'school_year' => $schoolYear,
                        'issued_on' => $now->toDateString(),
                        'quantity' => $line['quantity'],
                        'reason' => 'with_id',
                        'recorded_by' => Auth::id(),
                    ]);
                }

                $count++;
            }

            $this->syncStudentColumns($studentIds, $schoolYear);

            return $count;
        });

        return response()->json([
            'success' => true,
            'message' => $released === 0
                ? 'Those IDs were already released.'
                : $released . ' ' . ($released === 1 ? 'ID' : 'IDs') . ' released.',
            'updated' => $released,
            // Recorded either way — the desk has the slings in hand — but the
            // board should say so when the books now read short.
            'warnings' => $this->stockWarnings($supplies->pluck('id_supply_item_id')),
        ]);
    }

    /**
     * The student lost their ID. The card is closed off as lost, and unless
     * the desk says otherwise a replacement is started in the same breath.
     */
    public function reportLost(Request $request, IdCardIssuance $issuance): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'remarks' => 'nullable|string|max:1000',
            'reported_on' => 'nullable|date',
            'issue_replacement' => 'nullable|boolean',
            'fee' => 'nullable|numeric|min:0',
            'or_number' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (in_array($issuance->status, ['lost', 'voided'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'That card is already marked as ' . $issuance->status . '.',
            ], 422);
        }

        $replacement = DB::transaction(function () use ($request, $issuance) {
            $issuance->update([
                'status' => 'lost',
                'reported_lost_at' => $request->filled('reported_on')
                    ? Carbon::parse($request->input('reported_on'))
                    : Carbon::now(),
                'remarks' => $request->input('remarks') ?: $issuance->remarks,
            ]);

            if (!$request->boolean('issue_replacement', true)) {
                $this->syncStudentColumns([$issuance->pre_enrolled_student_id], $issuance->school_year);

                return null;
            }

            $replacement = IdCardIssuance::create([
                'pre_enrolled_student_id' => $issuance->pre_enrolled_student_id,
                'school_year' => $issuance->school_year,
                'sequence' => $this->nextSequence($issuance->pre_enrolled_student_id, $issuance->school_year),
                'reason' => 'lost',
                'status' => 'pending',
                'fee' => $request->input('fee'),
                'or_number' => $request->input('or_number'),
                'recorded_by' => Auth::id(),
            ]);

            $this->syncStudentColumns([$issuance->pre_enrolled_student_id], $issuance->school_year);

            return $replacement;
        });

        return response()->json([
            'success' => true,
            'message' => $replacement
                ? 'Card reported lost. A replacement is now waiting to be printed.'
                : 'Card reported lost.',
            'data' => $replacement ? $this->cardPayload($replacement) : null,
        ]);
    }

    /**
     * A fresh card for a student who already has one — damaged, a name
     * correction, or simply a reprint. Lost cards come through reportLost.
     */
    public function issueReplacement(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pre_enrolled_student_id' => 'required|exists:pre_enrolled_students,id',
            'school_year' => 'nullable|string|max:20',
            'reason' => 'required|in:lost,damaged,renewal,correction',
            'fee' => 'nullable|numeric|min:0',
            'or_number' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $schoolYear = $this->schoolYear($request);
        $studentId = (int) $request->input('pre_enrolled_student_id');

        $replacement = DB::transaction(function () use ($request, $studentId, $schoolYear) {
            // The card being replaced stops being the student's current one
            IdCardIssuance::where('pre_enrolled_student_id', $studentId)
                ->where('school_year', $schoolYear)
                ->whereIn('status', ['pending', 'printed', 'released'])
                ->update(['status' => $request->input('reason') === 'lost' ? 'lost' : 'voided']);

            $replacement = IdCardIssuance::create([
                'pre_enrolled_student_id' => $studentId,
                'school_year' => $schoolYear,
                'sequence' => $this->nextSequence($studentId, $schoolYear),
                'reason' => $request->input('reason'),
                'status' => 'pending',
                'fee' => $request->input('fee'),
                'or_number' => $request->input('or_number'),
                'remarks' => $request->input('remarks'),
                'recorded_by' => Auth::id(),
            ]);

            $this->syncStudentColumns([$studentId], $schoolYear);

            return $replacement;
        });

        return response()->json([
            'success' => true,
            'message' => 'Replacement ID recorded — it is now waiting to be printed.',
            'data' => $this->cardPayload($replacement),
        ], 201);
    }

    /** Undo a card recorded by mistake (admin only). */
    public function destroyCard(IdCardIssuance $issuance): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $studentId = $issuance->pre_enrolled_student_id;
        $schoolYear = $issuance->school_year;

        DB::transaction(function () use ($issuance, $studentId, $schoolYear) {
            // The sling and holder went out with this card, so removing the
            // card puts them back — nothing else can reach those rows now
            // that the stock list only shows what came in.
            $issuance->supplyIssuances()->delete();
            $issuance->delete();
            $this->syncStudentColumns([$studentId], $schoolYear);
        });

        return response()->json([
            'success' => true,
            'message' => 'Card record removed and any sling or holder put back.',
        ]);
    }

    // ───────────────────────────── supplies ─────────────────────────────

    /** Slings, holders and card stock — what came in, went out, and is left. */
    public function supplies(Request $request): JsonResponse
    {
        $schoolYear = $this->schoolYear($request);

        return response()->json([
            'success' => true,
            'school_year' => $schoolYear,
            'data' => $this->supplySummary($schoolYear),
            'can' => ['delete' => $this->isAdmin()],
        ]);
    }

    /** A new kind of stock to track — another sling colour, a new holder. */
    public function storeItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100|unique:id_supply_items,code',
            'category' => 'required|in:sling,holder,card,other',
            'description' => 'nullable|string|max:255',
            'low_stock_quantity' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $item = IdSupplyItem::create([
            'code' => $request->input('code') ?: $this->codeFor($request->input('name')),
            'name' => $request->input('name'),
            'category' => $request->input('category'),
            'description' => $request->input('description'),
            'low_stock_quantity' => $request->input('low_stock_quantity', 50),
            'sort_order' => (int) IdSupplyItem::max('sort_order') + 1,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$item->name} added to the stock list.",
            'data' => ['id' => $item->id],
        ], 201);
    }

    public function updateItem(Request $request, IdSupplyItem $item): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|in:sling,holder,card,other',
            'description' => 'nullable|string|max:255',
            'low_stock_quantity' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $item->update($validator->validated());

        return response()->json(['success' => true, 'message' => "{$item->name} updated."]);
    }

    /** Stock coming in. */
    public function storeDelivery(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_supply_item_id' => 'required|exists:id_supply_items,id',
            'delivery_date' => 'required|date',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $delivery = IdSupplyDelivery::create($validator->validated() + ['recorded_by' => Auth::id()]);
        $delivery->load('item:id,name');

        return response()->json([
            'success' => true,
            'message' => "{$delivery->quantity} × {$delivery->item->name} added to stock.",
            'data' => ['id' => $delivery->id],
        ], 201);
    }

    /** Stock going out on its own — a replacement sling, a sale, a write-off. */
    public function storeSupplyIssuance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_supply_item_id' => 'required|exists:id_supply_items,id',
            'pre_enrolled_student_id' => 'nullable|exists:pre_enrolled_students,id',
            'school_year' => 'nullable|string|max:20',
            'issued_on' => 'required|date',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|in:replacement,sale,loss,adjustment',
            'amount' => 'nullable|numeric|min:0',
            'or_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $issuance = IdSupplyIssuance::create(
            $validator->validated()
            + ['school_year' => $this->schoolYear($request), 'recorded_by' => Auth::id()]
        );
        $issuance->load('item:id,name');

        return response()->json([
            'success' => true,
            'message' => "{$issuance->quantity} × {$issuance->item->name} taken out of stock.",
            'warnings' => $this->stockWarnings(collect([$issuance->id_supply_item_id])),
            'data' => ['id' => $issuance->id],
        ], 201);
    }

    /**
     * Stock received — the deliveries behind the counts, newest first.
     *
     * What goes out is deliberately not listed here: every piece leaves with
     * a card, and that card is already its own line in the records. It still
     * comes off the count; this list is only the receiving side.
     */
    public function movements(Request $request): JsonResponse
    {
        $itemId = $request->input('id_supply_item_id');

        $query = DB::table('id_supply_deliveries as d')
            ->join('id_supply_items as i', 'i.id', '=', 'd.id_supply_item_id')
            ->leftJoin('users as u', 'u.id', '=', 'd.recorded_by')
            ->select([
                'd.id',
                'd.id_supply_item_id',
                'i.name AS item_name',
                'd.delivery_date AS happened_on',
                'd.quantity',
                'd.unit_cost',
                'd.supplier AS party',
                'd.reference',
                'd.notes',
                'u.name AS recorded_by_name',
            ])
            ->when($itemId, fn ($q) => $q->where('d.id_supply_item_id', $itemId))
            ->orderByDesc('d.delivery_date')
            ->orderByDesc('d.id');

        $rows = $query->paginate(min((int) $request->input('per_page', 25), 100));

        return response()->json([
            'success' => true,
            'data' => collect($rows->items())->map(fn ($row) => [
                'id' => $row->id,
                'id_supply_item_id' => $row->id_supply_item_id,
                'item_name' => $row->item_name,
                'happened_on' => $row->happened_on,
                'quantity' => (int) $row->quantity,
                'unit_cost' => $row->unit_cost !== null ? (float) $row->unit_cost : null,
                'party' => $row->party,
                'reference' => $row->reference,
                'notes' => $row->notes,
                'recorded_by_name' => $row->recorded_by_name,
            ]),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function destroyDelivery(IdSupplyDelivery $delivery): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $delivery->delete();

        return response()->json(['success' => true, 'message' => 'Delivery removed and the stock adjusted.']);
    }

    public function destroySupplyIssuance(IdSupplyIssuance $issuance): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin()) {
            return $denied;
        }

        $issuance->delete();

        return response()->json(['success' => true, 'message' => 'Record removed and the stock put back.']);
    }

    /** Students a stock issuance can be pinned to. */
    public function searchStudents(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));

        if ($search === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $students = PreEnrolledStudent::with('course:id,course_code')
            ->where(function ($query) use ($search) {
                $query->where('student_id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT(last_name, ', ', first_name) like ?", ["%{$search}%"]);
            })
            ->orderBy('last_name')
            ->take(12)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students->map(fn ($student) => [
                'id' => $student->id,
                'name' => $student->getFullNameAttribute(),
                'student_id_number' => $student->student_id_number,
                'course' => $student->course->course_code ?? null,
                'year_level' => $student->year,
            ]),
        ]);
    }

    // ───────────────────────────── the records ─────────────────────────────

    /** The full card log for a year — every print, release and replacement. */
    public function records(Request $request): JsonResponse
    {
        $schoolYear = $this->schoolYear($request);
        $search = trim((string) $request->input('search', ''));

        $query = IdCardIssuance::query()
            ->where('school_year', $schoolYear)
            ->with(['student:id,student_id_number,first_name,last_name,course_id,year', 'student.course:id,course_code', 'releaser:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('reason'), fn ($q) => $q->where('reason', $request->input('reason')))
            ->when($request->boolean('replacements_only'), fn ($q) => $q->where('sequence', '>', 1))
            ->when($search !== '', fn ($q) => $q->whereHas('student', function ($inner) use ($search) {
                $inner->where('student_id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]);
            }))
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $page = $query->paginate(min((int) $request->input('per_page', 25), 100));

        return response()->json([
            'success' => true,
            'data' => collect($page->items())->map(fn (IdCardIssuance $card) => $this->cardPayload($card) + [
                'student' => [
                    'id' => $card->student->id ?? null,
                    'name' => $card->student?->getFullNameAttribute(),
                    'student_id_number' => $card->student->student_id_number ?? null,
                    'course' => $card->student?->course->course_code ?? null,
                    'year_level' => $card->student->year ?? null,
                ],
                'released_by_name' => $card->releaser->name ?? null,
            ]),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    /** The year being looked at — the request's, else the newest on record. */
    private function schoolYear(Request $request): string
    {
        $requested = trim((string) $request->input('school_year', ''));
        if ($requested !== '') {
            return $requested;
        }

        return $this->schoolYears()[0] ?? $this->currentSchoolYear();
    }

    /** Years the school has students for, newest first. */
    private function schoolYears(): array
    {
        $years = DB::table('pre_enrolled_students')
            ->whereNotNull('school_year')
            ->where('school_year', '!=', '')
            ->distinct()
            ->orderByDesc('school_year')
            ->pluck('school_year')
            ->all();

        return $years ?: [$this->currentSchoolYear()];
    }

    /** June starts the new school year here. */
    private function currentSchoolYear(): string
    {
        $year = (int) date('n') >= 6 ? (int) date('Y') : (int) date('Y') - 1;

        return $year . '-' . ($year + 1);
    }

    private function enrolledQuery(string $schoolYear)
    {
        return PreEnrolledStudent::query()
            ->where('enrollment_status', 'enrolled')
            ->where('school_year', $schoolYear);
    }

    /**
     * Narrows the board to students whose card is in a given state. "Awaiting
     * print" is the only one that asks for the absence of a card, so it is the
     * only one that has to be written as a NOT EXISTS.
     */
    private function applyStatusFilter($query, string $status, string $schoolYear)
    {
        if ($status === '' || $status === 'all') {
            return $query;
        }

        $live = ['pending', 'printed', 'released'];

        if ($status === 'awaiting') {
            return $query->whereDoesntHave('idCards', fn ($q) => $q
                ->where('school_year', $schoolYear)
                ->whereIn('status', $live));
        }

        // A student whose card was lost and already replaced should show under
        // the replacement, not under "lost", so the match is on the live card
        return $query->whereHas('idCards', function ($q) use ($status, $schoolYear, $live) {
            $q->where('school_year', $schoolYear)->where('status', $status);

            if ($status !== 'lost' && $status !== 'voided') {
                $q->whereRaw(
                    'id_card_issuances.sequence = (
                        SELECT MAX(c2.sequence) FROM id_card_issuances c2
                        WHERE c2.pre_enrolled_student_id = id_card_issuances.pre_enrolled_student_id
                          AND c2.school_year = id_card_issuances.school_year
                          AND c2.status IN (?, ?, ?)
                    )',
                    $live
                );
            }
        });
    }

    /**
     * Cards for a page of students, newest first within each student. The
     * live card sorts ahead of closed ones so the board can take the first.
     */
    private function cardsFor($studentIds, string $schoolYear)
    {
        if ($studentIds->isEmpty()) {
            return collect();
        }

        return IdCardIssuance::whereIn('pre_enrolled_student_id', $studentIds)
            ->where('school_year', $schoolYear)
            ->get()
            ->sortByDesc(fn ($card) => [
                in_array($card->status, ['pending', 'printed', 'released'], true) ? 1 : 0,
                $card->sequence,
            ])
            ->groupBy('pre_enrolled_student_id');
    }

    private function cardPayload(IdCardIssuance $card): array
    {
        return [
            'id' => $card->id,
            'school_year' => $card->school_year,
            'sequence' => $card->sequence,
            'copy_label' => $card->copy_label,
            'reason' => $card->reason,
            'status' => $card->status,
            'printed_at' => $card->printed_at?->toDateTimeString(),
            'released_at' => $card->released_at?->toDateTimeString(),
            'reported_lost_at' => $card->reported_lost_at?->toDateTimeString(),
            'received_by' => $card->received_by,
            'fee' => $card->fee !== null ? (float) $card->fee : null,
            'or_number' => $card->or_number,
            'remarks' => $card->remarks,
            'is_replacement' => $card->sequence > 1,
        ];
    }

    /** The number the student's next card this year carries. */
    private function nextSequence(int $studentId, string $schoolYear): int
    {
        return (int) IdCardIssuance::where('pre_enrolled_student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->max('sequence') + 1;
    }

    /**
     * Mirrors the live card back onto the student row.
     *
     * The three id_* columns on pre_enrolled_students pre-date this board and
     * other screens still read them, so they are kept as a copy of the current
     * card rather than being left to drift.
     */
    private function syncStudentColumns(array $studentIds, string $schoolYear): void
    {
        if (!$studentIds) {
            return;
        }

        $live = IdCardIssuance::whereIn('pre_enrolled_student_id', $studentIds)
            ->where('school_year', $schoolYear)
            ->whereIn('status', ['pending', 'printed', 'released'])
            ->get()
            ->groupBy('pre_enrolled_student_id')
            ->map(fn ($cards) => $cards->sortByDesc('sequence')->first());

        foreach ($studentIds as $studentId) {
            $card = $live->get($studentId);

            PreEnrolledStudent::where('id', $studentId)->update([
                'id_status' => match ($card?->status) {
                    'released' => 'Released',
                    'printed' => 'Printed',
                    default => 'Pending Print',
                },
                'id_printed_at' => $card?->printed_at,
                'id_released_at' => $card?->released_at,
            ]);
        }
    }

    /** Stock on hand per item — delivered less issued. */
    private function onHandByItem($itemIds): array
    {
        $delivered = DB::table('id_supply_deliveries')
            ->whereIn('id_supply_item_id', $itemIds)
            ->selectRaw('id_supply_item_id, COALESCE(SUM(quantity), 0) AS quantity')
            ->groupBy('id_supply_item_id')
            ->pluck('quantity', 'id_supply_item_id');

        $issued = DB::table('id_supply_issuances')
            ->whereIn('id_supply_item_id', $itemIds)
            ->selectRaw('id_supply_item_id, COALESCE(SUM(quantity), 0) AS quantity')
            ->groupBy('id_supply_item_id')
            ->pluck('quantity', 'id_supply_item_id');

        $onHand = [];
        foreach ($itemIds as $id) {
            $onHand[$id] = (int) ($delivered[$id] ?? 0) - (int) ($issued[$id] ?? 0);
        }

        return $onHand;
    }

    /** Every stocked item with its running totals and the year's movement. */
    private function supplySummary(?string $schoolYear): array
    {
        $items = IdSupplyItem::active()->orderBy('sort_order')->orderBy('name')->get();

        if ($items->isEmpty()) {
            return [];
        }

        $ids = $items->pluck('id');

        $delivered = DB::table('id_supply_deliveries')
            ->whereIn('id_supply_item_id', $ids)
            ->selectRaw('id_supply_item_id, COALESCE(SUM(quantity), 0) AS quantity')
            ->groupBy('id_supply_item_id')
            ->pluck('quantity', 'id_supply_item_id');

        $issued = DB::table('id_supply_issuances')
            ->whereIn('id_supply_item_id', $ids)
            ->selectRaw('id_supply_item_id, COALESCE(SUM(quantity), 0) AS quantity')
            ->groupBy('id_supply_item_id')
            ->pluck('quantity', 'id_supply_item_id');

        $issuedThisYear = DB::table('id_supply_issuances')
            ->whereIn('id_supply_item_id', $ids)
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->selectRaw('id_supply_item_id, COALESCE(SUM(quantity), 0) AS quantity')
            ->groupBy('id_supply_item_id')
            ->pluck('quantity', 'id_supply_item_id');

        return $items->map(function (IdSupplyItem $item) use ($delivered, $issued, $issuedThisYear) {
            $in = (int) ($delivered[$item->id] ?? 0);
            $out = (int) ($issued[$item->id] ?? 0);
            $remaining = $in - $out;

            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'description' => $item->description,
                'delivered' => $in,
                'issued' => $out,
                'on_hand' => $remaining,
                'issued_this_year' => (int) ($issuedThisYear[$item->id] ?? 0),
                'low_stock_quantity' => $item->low_stock_quantity,
                // Strictly below, because the field reads "warn below N" —
                // sitting exactly on the figure is not yet short
                'is_low' => $remaining < $item->low_stock_quantity,
                'is_negative' => $remaining < 0,
            ];
        })->values()->all();
    }

    /** Items whose books read short after what was just taken out. */
    private function stockWarnings($itemIds): array
    {
        $ids = collect($itemIds)->unique()->values();

        if ($ids->isEmpty()) {
            return [];
        }

        $names = IdSupplyItem::whereIn('id', $ids)->pluck('name', 'id');

        return collect($this->onHandByItem($ids))
            ->map(fn ($remaining, $id) => $remaining < 0
                ? "{$names[$id]} is now {$remaining} — record the delivery it came from."
                : null)
            ->filter()
            ->values()
            ->all();
    }

    /** Courses the year's students are actually in, for the filter. */
    private function courseOptions(string $schoolYear): array
    {
        return DB::table('pre_enrolled_students as s')
            ->join('courses as c', 'c.id', '=', 's.course_id')
            ->where('s.enrollment_status', 'enrolled')
            ->where('s.school_year', $schoolYear)
            ->selectRaw('c.id, c.course_code, c.course_name, COUNT(*) AS students')
            ->groupBy('c.id', 'c.course_code', 'c.course_name')
            ->orderBy('c.course_code')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'code' => $row->course_code,
                'name' => $row->course_name,
                'students' => (int) $row->students,
            ])
            ->all();
    }

    private function yearLevelOptions(string $schoolYear): array
    {
        return DB::table('pre_enrolled_students')
            ->where('enrollment_status', 'enrolled')
            ->where('school_year', $schoolYear)
            ->whereNotNull('year')
            ->where('year', '!=', '')
            ->distinct()
            ->orderBy('year')
            ->pluck('year')
            ->all();
    }

    private function codeFor(string $name): string
    {
        $base = preg_replace('/[^a-z0-9]+/', '_', strtolower($name));
        $base = trim($base, '_') ?: 'item';
        $code = $base;
        $suffix = 2;

        while (IdSupplyItem::where('code', $code)->exists()) {
            $code = $base . '_' . $suffix++;
        }

        return $code;
    }
}
