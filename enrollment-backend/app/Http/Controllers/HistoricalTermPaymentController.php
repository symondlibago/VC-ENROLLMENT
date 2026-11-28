<?php

namespace App\Http\Controllers;

use App\Models\HistoricalTermPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * The archive of pre-system term payments, and the bulk entry behind it.
 *
 * Authorisation is on the routes (see routes/api.php). Nothing here trusts the
 * front end to have hidden a button: a student assistant's token reaches only
 * the endpoints their role is listed on.
 */
class HistoricalTermPaymentController extends Controller
{
    /** One sitting's worth of typing. Keeps a single request bounded. */
    private const MAX_BATCH = 200;

    /** Beyond this a PDF is not a report anyone reads, and the query hurts. */
    private const MAX_EXPORT = 5000;

    /**
     * The archive, a page at a time.
     *
     * Never returns the whole table: this grows by thousands of rows a sitting
     * and the entry page only ever shows the term being worked on.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_year' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', 'string', 'max:40'],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $page = HistoricalTermPayment::query()
            ->forTerm($validated['school_year'] ?? null, $validated['semester'] ?? null)
            ->search($validated['search'] ?? null)
            ->with('recorder:id,name')
            ->latest('id')
            ->paginate($validated['per_page'] ?? 25);

        return response()->json([
            'success' => true,
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /** What has already been typed up, so a term is not keyed in twice. */
    public function summary(Request $request): JsonResponse
    {
        $rows = HistoricalTermPayment::query()
            ->select('school_year', 'semester', DB::raw('count(*) as entries'), DB::raw('sum(paid_amount) as paid'))
            ->groupBy('school_year', 'semester')
            ->orderByDesc('school_year')
            ->orderBy('semester')
            ->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Save a batch typed in one sitting.
     *
     * Every row is validated before anything is written, and the whole batch
     * goes in one transaction — so a bad row at the bottom of the list cannot
     * leave the first forty saved and the rest lost.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entries' => ['required', 'array', 'min:1', 'max:' . self::MAX_BATCH],
            'entries.*.student_name' => ['required', 'string', 'max:255'],
            'entries.*.course' => ['required', 'string', 'max:255'],
            'entries.*.school_year' => ['required', 'string', 'max:20'],
            'entries.*.semester' => ['required', 'string', 'max:40'],
            'entries.*.paid_amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'entries.*.balance' => ['required', 'numeric', 'min:0', 'max:9999999999'],
        ], [
            'entries.max' => 'Save in batches of ' . self::MAX_BATCH . ' or fewer.',
        ]);

        $now = now();
        $userId = Auth::id();

        $rows = array_map(static fn (array $entry) => [
            'student_name' => trim($entry['student_name']),
            'course' => trim($entry['course']),
            'school_year' => trim($entry['school_year']),
            'semester' => trim($entry['semester']),
            'paid_amount' => round((float) $entry['paid_amount'], 2),
            'balance' => round((float) $entry['balance'], 2),
            'recorded_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ], $validated['entries']);

        try {
            DB::transaction(function () use ($rows) {
                // One statement per chunk rather than one per row: a sitting of
                // two hundred is a couple of round trips, not two hundred.
                foreach (array_chunk($rows, 50) as $chunk) {
                    HistoricalTermPayment::insert($chunk);
                }
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not save the batch. Nothing was written.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => count($rows) . ' ' . (count($rows) === 1 ? 'entry' : 'entries') . ' saved.',
            'saved' => count($rows),
        ], 201);
    }

    /**
     * Everything matching a filter, for the PDF.
     *
     * Separate from index() because a report is the one case that genuinely
     * wants the whole set rather than a page of it. Still capped: a request
     * that would return more than this is a report nobody reads, and an
     * unbounded query here is how a page like this takes the server down.
     */
    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_year' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', 'string', 'max:40'],
        ]);

        $query = HistoricalTermPayment::query()
            ->forTerm($validated['school_year'] ?? null, $validated['semester'] ?? null);

        $total = (clone $query)->count();
        if ($total > self::MAX_EXPORT) {
            return response()->json([
                'success' => false,
                'message' => "That is {$total} entries — narrow it to a school year or semester first.",
            ], 422);
        }

        $rows = $query
            ->orderBy('school_year')
            ->orderBy('semester')
            ->orderBy('student_name')
            ->get(['id', 'student_name', 'course', 'school_year', 'semester', 'paid_amount', 'balance']);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /** Correct one saved line — a name misread off the ledger, a wrong figure. */
    public function update(Request $request, HistoricalTermPayment $historicalTermPayment): JsonResponse
    {
        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'max:255'],
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'string', 'max:40'],
            'paid_amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'balance' => ['required', 'numeric', 'min:0', 'max:9999999999'],
        ]);

        $historicalTermPayment->update([
            'student_name' => trim($validated['student_name']),
            'course' => trim($validated['course']),
            'school_year' => trim($validated['school_year']),
            'semester' => trim($validated['semester']),
            'paid_amount' => round((float) $validated['paid_amount'], 2),
            'balance' => round((float) $validated['balance'], 2),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entry updated.',
            'data' => $historicalTermPayment->fresh(),
        ]);
    }

    /** Remove one entry — a mistyped line, found after it was saved. */
    public function destroy(HistoricalTermPayment $historicalTermPayment): JsonResponse
    {
        $historicalTermPayment->delete();

        return response()->json(['success' => true, 'message' => 'Entry removed.']);
    }
}
