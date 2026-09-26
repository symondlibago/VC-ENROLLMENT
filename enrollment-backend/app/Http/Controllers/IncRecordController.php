<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\IncRecord;
use App\Models\Instructor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * INC (incomplete) completion forms.
 *
 * Flow: a grade marked INC opens a record → the cashier records the payment
 * (which stamps their approval) → the instructor and program head approve in
 * either order → the registrar approves last, which completes the record and
 * allows the completion form to be exported.
 */
class IncRecordController extends Controller
{
    /** Which approval step a role is responsible for. Admin may act for any. */
    private const ROLE_STEPS = [
        'Cashier' => 'cashier',
        'instructor' => 'instructor',
        'Program Head' => 'program_head',
        'Registrar' => 'registrar',
    ];

    private function stepForUser($user, ?string $requestedStep = null): ?string
    {
        if ($user->role === 'Admin') {
            // An admin may stand in for any desk
            return $requestedStep;
        }

        $step = self::ROLE_STEPS[$user->role] ?? null;
        return ($requestedStep && $requestedStep !== $step) ? null : $step;
    }

    /**
     * Records visible to the signed-in user. Instructors only see the subjects
     * they handle; every other role involved sees all of them.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar', 'Program Head', 'Cashier', 'instructor'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $query = IncRecord::with([
            'student.course',
            'subject',
            'section',
            'instructor.user:id,name',
            'grade',
        ])->orderByDesc('created_at');

        if ($user->role === 'instructor') {
            $instructor = Instructor::where('user_id', $user->id)->first();
            if (!$instructor) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $query->where('instructor_id', $instructor->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Money is the cashier's and registrar's business; instructors and
        // program heads see only that a payment was made.
        $seesPayment = in_array($user->role, ['Admin', 'Cashier', 'Registrar']);

        $records = $query->get()->map(fn ($record) => $this->format($record, $seesPayment));

        return response()->json([
            'success' => true,
            'data' => $records,
            'can' => [
                'process_payment' => in_array($user->role, ['Admin', 'Cashier']),
                'approve' => array_values(array_filter([
                    $user->role === 'Admin' ? 'all' : ($this->stepForUser($user) ?: null),
                ])),
                'generate_document' => in_array($user->role, ['Admin', 'Registrar']),
            ],
            'role' => $user->role,
        ]);
    }

    /** Cashier (or admin) records the payment; that also stamps their approval. */
    public function processPayment(Request $request, IncRecord $incRecord): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Cashier'])) {
            return response()->json(['success' => false, 'message' => 'Only the cashier can process INC payments.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'or_number' => 'required|string|max:255',
            'payment_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($incRecord->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'This INC record has been withdrawn.'], 422);
        }

        $incRecord->fill([
            'amount' => $request->amount,
            'or_number' => $request->or_number,
            'payment_date' => $request->payment_date,
            'cashier_approved_at' => now(),
            'cashier_approved_by' => $user->id,
        ]);
        $incRecord->refreshStatus();
        $incRecord->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded. The form can now be approved.',
            'data' => $this->format($incRecord->fresh($this->relations())),
        ]);
    }

    /**
     * One receipt often covers several of a student's INC subjects, and a
     * student may choose to settle only some of them. This records the payment
     * for each selected subject in a single transaction, sharing the O.R.
     * number and date while keeping each subject's own amount.
     */
    public function processPaymentBulk(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Cashier'])) {
            return response()->json(['success' => false, 'message' => 'Only the cashier can process INC payments.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'or_number' => 'required|string|max:255',
            'payment_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:inc_records,id',
            'items.*.amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $updated = [];

        DB::transaction(function () use ($request, $user, &$updated) {
            foreach ($request->input('items') as $item) {
                $record = IncRecord::find($item['id']);
                if (!$record || $record->status === 'cancelled' || $record->cashier_approved_at) {
                    continue; // already paid or withdrawn — leave it alone
                }

                $record->fill([
                    'amount' => $item['amount'],
                    'or_number' => $request->input('or_number'),
                    'payment_date' => $request->input('payment_date'),
                    'cashier_approved_at' => now(),
                    'cashier_approved_by' => $user->id,
                ]);
                $record->refreshStatus();
                $record->save();

                $updated[] = $record->id;
            }
        });

        $records = IncRecord::with($this->relations())->whereIn('id', $updated)->get()
            ->map(fn ($record) => $this->format($record));

        return response()->json([
            'success' => true,
            'message' => count($updated) === 1
                ? 'Payment recorded for 1 subject.'
                : 'Payment recorded for ' . count($updated) . ' subjects.',
            'data' => $records,
        ]);
    }

    /** Instructor, program head or registrar approval (admin may act for any). */
    public function approve(Request $request, IncRecord $incRecord): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'step' => ['nullable', 'string', Rule::in(IncRecord::APPROVAL_STEPS)],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $step = $this->stepForUser($user, $request->input('step'));
        if (!$step) {
            return response()->json(['success' => false, 'message' => 'You cannot approve this step.'], 403);
        }

        if ($incRecord->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'This INC record has been withdrawn.'], 422);
        }

        // Payment always comes first
        if ($step !== 'cashier' && !$incRecord->cashier_approved_at) {
            return response()->json([
                'success' => false,
                'message' => 'The INC payment has not been processed yet.',
            ], 422);
        }

        // The registrar signs last
        if ($step === 'registrar' && !($incRecord->instructor_approved_at && $incRecord->program_head_approved_at)) {
            return response()->json([
                'success' => false,
                'message' => 'The instructor and program head must approve before the registrar.',
            ], 422);
        }

        $incRecord->{"{$step}_approved_at"} = now();
        $incRecord->{"{$step}_approved_by"} = $user->id;
        $incRecord->refreshStatus();
        $incRecord->save();

        return response()->json([
            'success' => true,
            'message' => 'Approval recorded.',
            'data' => $this->format($incRecord->fresh($this->relations())),
        ]);
    }

    /** Undo an approval (admin only), in case it was given by mistake. */
    public function revokeApproval(Request $request, IncRecord $incRecord): JsonResponse
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Only an admin can undo an approval.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'step' => ['required', 'string', Rule::in(IncRecord::APPROVAL_STEPS)],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $step = $request->input('step');
        $incRecord->{"{$step}_approved_at"} = null;
        $incRecord->{"{$step}_approved_by"} = null;

        // Later approvals no longer stand once an earlier one is withdrawn
        if ($step === 'cashier') {
            foreach (['instructor', 'program_head', 'registrar'] as $later) {
                $incRecord->{"{$later}_approved_at"} = null;
                $incRecord->{"{$later}_approved_by"} = null;
            }
        } elseif (in_array($step, ['instructor', 'program_head'], true)) {
            $incRecord->registrar_approved_at = null;
            $incRecord->registrar_approved_by = null;
        }

        $incRecord->refreshStatus();
        $incRecord->save();

        return response()->json([
            'success' => true,
            'message' => 'Approval withdrawn.',
            'data' => $this->format($incRecord->fresh($this->relations())),
        ]);
    }

    private function relations(): array
    {
        return ['student.course', 'subject', 'section', 'instructor.user', 'grade'];
    }

    /**
     * Shapes a record for the INC page and the completion form, including the
     * rating that goes on the printed document.
     */
    private function format(IncRecord $record, bool $seesPayment = true): array
    {
        $student = $record->student;
        $grade = $record->grade;

        return [
            'id' => $record->id,
            'status' => $record->status,
            'student' => [
                'id' => $student->id ?? null,
                'name' => $student ? $student->getFullNameAttribute() : 'Unknown',
                'student_id_number' => $student->student_id_number ?? null,
                'course_code' => $student->course->course_code ?? null,
                'course_name' => $student->course->course_name ?? null,
                'year' => $record->year ?? $student->year ?? null,
            ],
            'subject' => [
                'id' => $record->subject_id,
                'subject_code' => $record->subject->subject_code ?? null,
                'descriptive_title' => $record->subject->descriptive_title ?? null,
                'total_units' => $record->subject->total_units ?? null,
            ],
            'section' => $record->section->name ?? null,
            'instructor_name' => $record->instructor->user->name ?? null,
            'school_year' => $record->school_year,
            'semester' => $record->semester,
            'final_grade' => $grade->final_grade ?? null,
            'payment' => [
                // Amount and O.R. number are withheld from roles that have no
                // business with the money; 'is_paid' is enough for them.
                'amount' => $seesPayment ? $record->amount : null,
                'or_number' => $seesPayment ? $record->or_number : null,
                'payment_date' => $seesPayment ? optional($record->payment_date)->toDateString() : null,
                'is_paid' => (bool) $record->cashier_approved_at,
                'visible' => $seesPayment,
            ],
            'approvals' => [
                'cashier' => $record->cashier_approved_at?->toDateTimeString(),
                'instructor' => $record->instructor_approved_at?->toDateTimeString(),
                'program_head' => $record->program_head_approved_at?->toDateTimeString(),
                'registrar' => $record->registrar_approved_at?->toDateTimeString(),
            ],
            'is_fully_approved' => $record->isFullyApproved(),
            'created_at' => $record->created_at?->toDateTimeString(),
        ];
    }
}
