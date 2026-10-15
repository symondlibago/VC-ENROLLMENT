<?php

namespace App\Http\Controllers;

use App\Models\FabricDelivery;
use App\Models\FabricPurchase;
use App\Models\FabricType;
use App\Models\PreEnrolledStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Uniform fabric monitoring.
 *
 * Deliveries add stock, student purchases take it away, and what is left is the
 * difference. Every figure on the board comes from a grouped aggregate rather
 * than from walking the rows, so the page stays fast as the records build up.
 */
class UniformFabricController extends Controller
{
    /** Only the cashier sells fabric; the admin can do everything. */
    private const DESK_ROLES = ['Admin', 'Cashier'];

    private function authorizeDesk(): ?JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return null;
    }

    /** Stock on hand, plus the figures for the period being looked at. */
    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        [$from, $to] = $this->period($request);

        $types = FabricType::active()->orderBy('sort_order')->orderBy('name')->get();

        // One grouped row per fabric, whatever the number of records
        $delivered = DB::table('fabric_deliveries')
            ->selectRaw('fabric_type_id, COALESCE(SUM(meters), 0) AS meters, COALESCE(SUM(rolls), 0) AS rolls')
            ->groupBy('fabric_type_id')
            ->get()
            ->keyBy('fabric_type_id');

        $sold = DB::table('fabric_purchase_items')
            ->selectRaw('fabric_type_id, COALESCE(SUM(meters), 0) AS meters')
            ->groupBy('fabric_type_id')
            ->get()
            ->keyBy('fabric_type_id');

        // The same two figures again, limited to the chosen period
        $deliveredInPeriod = DB::table('fabric_deliveries')
            ->selectRaw('fabric_type_id, COALESCE(SUM(meters), 0) AS meters, COALESCE(SUM(rolls), 0) AS rolls')
            ->when($from, fn ($q) => $q->whereDate('delivery_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('delivery_date', '<=', $to))
            ->groupBy('fabric_type_id')
            ->get()
            ->keyBy('fabric_type_id');

        $soldInPeriod = DB::table('fabric_purchase_items')
            ->join('fabric_purchases', 'fabric_purchases.id', '=', 'fabric_purchase_items.fabric_purchase_id')
            ->selectRaw('fabric_type_id, COALESCE(SUM(fabric_purchase_items.meters), 0) AS meters')
            ->when($from, fn ($q) => $q->whereDate('fabric_purchases.purchase_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('fabric_purchases.purchase_date', '<=', $to))
            ->groupBy('fabric_type_id')
            ->get()
            ->keyBy('fabric_type_id');

        $summary = $types->map(function (FabricType $type) use ($delivered, $sold, $deliveredInPeriod, $soldInPeriod) {
            $deliveredMeters = (float) ($delivered[$type->id]->meters ?? 0);
            $deliveredRolls = (int) ($delivered[$type->id]->rolls ?? 0);
            $soldMeters = (float) ($sold[$type->id]->meters ?? 0);
            $remaining = round($deliveredMeters - $soldMeters, 2);

            // Rolls are cut as they are sold, so what is left is expressed in
            // whole-roll equivalents from the average roll length received.
            $metersPerRoll = $deliveredRolls > 0 ? $deliveredMeters / $deliveredRolls : null;

            return [
                'id' => $type->id,
                'code' => $type->code,
                'name' => $type->name,
                'description' => $type->description,
                'delivered_meters' => round($deliveredMeters, 2),
                'delivered_rolls' => $deliveredRolls,
                'sold_meters' => round($soldMeters, 2),
                'remaining_meters' => $remaining,
                'meters_per_roll' => $metersPerRoll ? round($metersPerRoll, 2) : null,
                'remaining_rolls' => $metersPerRoll ? round($remaining / $metersPerRoll, 1) : null,
                'low_stock_meters' => (float) $type->low_stock_meters,
                'is_low' => $remaining <= (float) $type->low_stock_meters,
                'period' => [
                    'delivered_meters' => round((float) ($deliveredInPeriod[$type->id]->meters ?? 0), 2),
                    'delivered_rolls' => (int) ($deliveredInPeriod[$type->id]->rolls ?? 0),
                    'sold_meters' => round((float) ($soldInPeriod[$type->id]->meters ?? 0), 2),
                ],
            ];
        });

        // Headline numbers for the period, again as single aggregates
        $purchaseStats = DB::table('fabric_purchases')
            ->selectRaw('COUNT(*) AS purchases, COALESCE(SUM(total_meters), 0) AS meters, COALESCE(SUM(amount), 0) AS amount')
            ->when($from, fn ($q) => $q->whereDate('purchase_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('purchase_date', '<=', $to))
            ->first();

        // A student who buys twice is still one student served
        $studentsServed = DB::table('fabric_purchases')
            ->when($from, fn ($q) => $q->whereDate('purchase_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('purchase_date', '<=', $to))
            ->selectRaw('COUNT(DISTINCT COALESCE(pre_enrolled_student_id, student_id_number, student_name)) AS students')
            ->value('students');

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'fabric_types' => $types->map(fn ($type) => [
                'id' => $type->id,
                'code' => $type->code,
                'name' => $type->name,
            ]),
            'totals' => [
                'remaining_meters' => round($summary->sum('remaining_meters'), 2),
                'purchases' => (int) ($purchaseStats->purchases ?? 0),
                'students_served' => (int) ($studentsServed ?? 0),
                'meters_sold' => round((float) ($purchaseStats->meters ?? 0), 2),
                'amount_collected' => round((float) ($purchaseStats->amount ?? 0), 2),
            ],
            'period' => ['from' => $from, 'to' => $to],
            'can' => [
                'record_sale' => true,
                'record_delivery' => true,
                'delete' => Auth::user()->role === 'Admin',
            ],
            'role' => Auth::user()->role,
        ]);
    }

    /** The student purchase list — paginated, newest first. */
    public function purchases(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        [$from, $to] = $this->period($request);
        $search = trim((string) $request->input('search', ''));

        $query = FabricPurchase::query()
            ->with(['items:id,fabric_purchase_id,fabric_type_id,meters'])
            ->when($from, fn ($q) => $q->whereDate('purchase_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('purchase_date', '<=', $to))
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('student_name', 'like', "%{$search}%")
                    ->orWhere('student_id_number', 'like', "%{$search}%")
                    ->orWhere('or_number', 'like', "%{$search}%");
            }))
            // Only the purchases that included a given fabric
            ->when($request->filled('fabric_type_id'), fn ($q) => $q->whereExists(
                fn ($sub) => $sub->select(DB::raw(1))
                    ->from('fabric_purchase_items')
                    ->whereColumn('fabric_purchase_items.fabric_purchase_id', 'fabric_purchases.id')
                    ->where('fabric_purchase_items.fabric_type_id', $request->input('fabric_type_id'))
            ))
            ->orderByDesc('purchase_date')
            ->orderByDesc('id');

        $page = $query->paginate(min((int) $request->input('per_page', 25), 100));

        return response()->json([
            'success' => true,
            'data' => collect($page->items())->map(fn (FabricPurchase $purchase) => [
                'id' => $purchase->id,
                'student' => [
                    'id' => $purchase->pre_enrolled_student_id,
                    'name' => $purchase->student_name,
                    'student_id_number' => $purchase->student_id_number,
                    'course' => $purchase->course,
                    'year_level' => $purchase->year_level,
                    'is_linked' => (bool) $purchase->pre_enrolled_student_id,
                ],
                'or_number' => $purchase->or_number,
                'purchase_date' => optional($purchase->purchase_date)->toDateString(),
                'total_meters' => (float) $purchase->total_meters,
                'amount' => $purchase->amount !== null ? (float) $purchase->amount : null,
                'notes' => $purchase->notes,
                // Keyed by fabric so the table can line the columns up directly
                'meters' => $purchase->items->mapWithKeys(
                    fn ($item) => [$item->fabric_type_id => (float) $item->meters]
                ),
                'created_at' => $purchase->created_at?->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /** The delivery list — what came in, when. */
    public function deliveries(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        [$from, $to] = $this->period($request);

        $query = FabricDelivery::query()
            ->with('fabricType:id,code,name')
            ->when($from, fn ($q) => $q->whereDate('delivery_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('delivery_date', '<=', $to))
            ->when($request->filled('fabric_type_id'), fn ($q) => $q->where('fabric_type_id', $request->input('fabric_type_id')))
            ->orderByDesc('delivery_date')
            ->orderByDesc('id');

        $page = $query->paginate(min((int) $request->input('per_page', 25), 100));

        return response()->json([
            'success' => true,
            'data' => collect($page->items())->map(fn (FabricDelivery $delivery) => [
                'id' => $delivery->id,
                'fabric_type_id' => $delivery->fabric_type_id,
                'fabric_name' => $delivery->fabricType->name ?? null,
                'delivery_date' => optional($delivery->delivery_date)->toDateString(),
                'rolls' => $delivery->rolls,
                'meters' => (float) $delivery->meters,
                'supplier' => $delivery->supplier,
                'reference' => $delivery->reference,
                'notes' => $delivery->notes,
            ]),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /** Cashier records a student's fabric purchase against one O.R. */
    public function storePurchase(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'pre_enrolled_student_id' => 'nullable|exists:pre_enrolled_students,id',
            'student_name' => 'required|string|max:255',
            'student_id_number' => 'nullable|string|max:100',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:50',
            'or_number' => 'required|string|max:100',
            'purchase_date' => 'required|date',
            'amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.fabric_type_id' => 'required|exists:fabric_types,id',
            'items.*.meters' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Blank rows are fine in the form; a purchase of nothing is not
        $items = collect($request->input('items'))
            ->filter(fn ($item) => (float) $item['meters'] > 0)
            ->values();

        if ($items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Enter the metres for at least one fabric.',
            ], 422);
        }

        // You cannot sell cloth that is not there. The cashier may still have
        // the bolt in hand with its delivery unencoded, so the block can be
        // overridden deliberately — but never by accident.
        $shortfalls = $this->shortfalls($items);

        if ($shortfalls && !$request->boolean('allow_oversell')) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough fabric on hand: '
                    . implode('; ', array_column($shortfalls, 'message')) . '.',
                'shortfalls' => $shortfalls,
                'requires_override' => true,
            ], 422);
        }

        $purchase = DB::transaction(function () use ($request, $items) {
            $purchase = FabricPurchase::create([
                'pre_enrolled_student_id' => $request->input('pre_enrolled_student_id'),
                'student_name' => $request->input('student_name'),
                'student_id_number' => $request->input('student_id_number'),
                'course' => $request->input('course'),
                'year_level' => $request->input('year_level'),
                'or_number' => $request->input('or_number'),
                'purchase_date' => $request->input('purchase_date'),
                'total_meters' => $items->sum(fn ($item) => (float) $item['meters']),
                'amount' => $request->input('amount'),
                'notes' => $request->input('notes'),
                'recorded_by' => Auth::id(),
            ]);

            $purchase->items()->createMany($items->map(fn ($item) => [
                'fabric_type_id' => $item['fabric_type_id'],
                'meters' => $item['meters'],
            ])->all());

            return $purchase;
        });

        // Recorded either way — the cashier has the fabric in hand — but the
        // board should say so when the books now read short.
        $warnings = $this->stockWarnings($items);

        return response()->json([
            'success' => true,
            'message' => 'Fabric purchase recorded for ' . $purchase->student_name . '.',
            'warnings' => $warnings,
            'data' => ['id' => $purchase->id],
        ], 201);
    }

    /** Stock coming in — rolls and metres received on a date. */
    public function storeDelivery(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        $validator = Validator::make($request->all(), [
            'fabric_type_id' => 'required|exists:fabric_types,id',
            'delivery_date' => 'required|date',
            'rolls' => 'required|integer|min:0',
            'meters' => 'required|numeric|min:0.01',
            'supplier' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $delivery = FabricDelivery::create($validator->validated() + ['recorded_by' => Auth::id()]);
        $delivery->load('fabricType:id,name');

        return response()->json([
            'success' => true,
            'message' => "{$delivery->meters} m of {$delivery->fabricType->name} added to stock.",
            'data' => ['id' => $delivery->id],
        ], 201);
    }

    /** Removes a record that was entered by mistake (admin only). */
    public function destroyPurchase(FabricPurchase $purchase): JsonResponse
    {
        if (Auth::user()?->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Only an admin can remove a record.'], 403);
        }

        $purchase->delete(); // line items cascade

        return response()->json(['success' => true, 'message' => 'Purchase removed and the stock put back.']);
    }

    public function destroyDelivery(FabricDelivery $delivery): JsonResponse
    {
        if (Auth::user()?->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Only an admin can remove a record.'], 403);
        }

        $delivery->delete();

        return response()->json(['success' => true, 'message' => 'Delivery removed and the stock adjusted.']);
    }

    /** Students the cashier can ring a purchase up against. */
    public function searchStudents(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeDesk()) {
            return $denied;
        }

        $search = trim((string) $request->input('search', ''));
        if ($search === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $students = PreEnrolledStudent::with('course:id,course_code,course_name')
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

    // ───────────────────────────── helpers ─────────────────────────────

    /** The date range being looked at; either end may be left open. */
    private function period(Request $request): array
    {
        return [
            $request->filled('from') ? $request->input('from') : null,
            $request->filled('to') ? $request->input('to') : null,
        ];
    }

    /** Metres on hand for each of the given fabrics — delivered less sold. */
    private function remainingByType($ids): array
    {
        $delivered = DB::table('fabric_deliveries')
            ->whereIn('fabric_type_id', $ids)
            ->selectRaw('fabric_type_id, COALESCE(SUM(meters), 0) AS meters')
            ->groupBy('fabric_type_id')
            ->pluck('meters', 'fabric_type_id');

        $sold = DB::table('fabric_purchase_items')
            ->whereIn('fabric_type_id', $ids)
            ->selectRaw('fabric_type_id, COALESCE(SUM(meters), 0) AS meters')
            ->groupBy('fabric_type_id')
            ->pluck('meters', 'fabric_type_id');

        $remaining = [];
        foreach ($ids as $id) {
            $remaining[$id] = round((float) ($delivered[$id] ?? 0) - (float) ($sold[$id] ?? 0), 2);
        }

        return $remaining;
    }

    /**
     * Fabrics the sale would take more of than is on hand. A student can buy
     * the same fabric on two lines, so the lines are added up per fabric first.
     */
    private function shortfalls($items): array
    {
        $wanted = $items
            ->groupBy('fabric_type_id')
            ->map(fn ($lines) => round($lines->sum(fn ($line) => (float) $line['meters']), 2));

        $remaining = $this->remainingByType($wanted->keys());
        $names = FabricType::whereIn('id', $wanted->keys())->pluck('name', 'id');

        $shortfalls = [];

        foreach ($wanted as $id => $needed) {
            $onHand = $remaining[$id] ?? 0;
            if ($needed <= $onHand) {
                continue;
            }

            $name = $names[$id] ?? 'Fabric';
            $shortfalls[] = [
                'fabric_type_id' => (int) $id,
                'name' => $name,
                'requested' => $needed,
                'remaining' => $onHand,
                'short' => round($needed - $onHand, 2),
                'message' => "{$name} — {$needed} m needed, only {$onHand} m on hand",
            ];
        }

        return $shortfalls;
    }

    /** Fabrics whose books read short after the metres just sold. */
    private function stockWarnings($items): array
    {
        $ids = $items->pluck('fabric_type_id')->unique();
        $names = FabricType::whereIn('id', $ids)->pluck('name', 'id');

        return collect($this->remainingByType($ids))
            ->map(fn ($remaining, $id) => $remaining < 0
                ? "{$names[$id]} is now {$remaining} m — record the delivery it came from."
                : null)
            ->filter()
            ->values()
            ->all();
    }
}
