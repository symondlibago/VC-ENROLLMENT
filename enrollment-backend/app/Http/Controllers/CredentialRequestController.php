<?php

namespace App\Http\Controllers;

use App\Mail\CredentialClaimStubMail;
use App\Models\CredentialRequest;
use App\Models\PreEnrolledStudent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Credential requests (VIPC-RO-15).
 *
 * Flow: the registrar encodes the request → the library, laboratory and program
 * head give their clearance in any order → the cashier records the payment →
 * the registrar releases it, schedules the claiming and emails the claim stub.
 */
class CredentialRequestController extends Controller
{
    /** Which clearance a role is responsible for. Admin may act for any desk. */
    private const ROLE_STEPS = [
        'Librarian' => 'librarian',
        'Laboratory' => 'laboratory',
        'Program Head' => 'program_head',
        'Cashier' => 'cashier',
        'Registrar' => 'registrar',
    ];

    /** Roles that may open the credential board at all. */
    private const DESK_ROLES = ['Admin', 'Registrar', 'Program Head', 'Cashier', 'Librarian', 'Laboratory'];

    /** Desks that sign through the plain approval endpoint. */
    private const SIGNABLE_STEPS = ['librarian', 'laboratory', 'program_head'];

    /** Money is the cashier's and registrar's business only. */
    private function seesPayment($user): bool
    {
        return in_array($user->role, ['Admin', 'Cashier', 'Registrar'], true);
    }

    private function isAdmin($user): bool
    {
        return $user->role === 'Admin';
    }

    /** The requests, with what the signed-in user is allowed to do with them. */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $query = CredentialRequest::with('student:id,student_id_number')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $records = $query->get();
        $names = $this->nameMap($records);
        $seesPayment = $this->seesPayment($user);

        return response()->json([
            'success' => true,
            'data' => $records->map(fn ($record) => $this->format($record, $seesPayment, $names)),
            'can' => [
                'create' => in_array($user->role, ['Admin', 'Registrar'], true),
                'edit' => in_array($user->role, ['Admin', 'Registrar'], true),
                'process_payment' => in_array($user->role, ['Admin', 'Cashier'], true),
                'release' => in_array($user->role, ['Admin', 'Registrar'], true),
                'generate_document' => in_array($user->role, ['Admin', 'Registrar'], true),
                'revoke' => $this->isAdmin($user),
                'see_payment' => $seesPayment,
                'approve' => $this->isAdmin($user) ? 'all' : (self::ROLE_STEPS[$user->role] ?? null),
            ],
            'options' => [
                'credentials' => CredentialRequest::CREDENTIAL_TYPES,
                'purposes' => CredentialRequest::PURPOSES,
            ],
            'role' => $user->role,
        ]);
    }

    /** Registrar encodes a new request, for a system student or an alumnus. */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the registrar can file a credential request.'], 403);
        }

        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $credentialRequest = new CredentialRequest($this->payload($request));
        $credentialRequest->created_by = $user->id;
        $credentialRequest->status = 'pending';
        $credentialRequest->save();

        return response()->json([
            'success' => true,
            'message' => "Request {$credentialRequest->request_number} filed. It now goes to the library, laboratory and program head.",
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ], 201);
    }

    /**
     * Details can be corrected while the request is still moving — a student's
     * email in particular, since the claim stub is sent to it.
     */
    public function update(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the registrar can edit a credential request.'], 403);
        }

        if ($credentialRequest->released_at && !$this->isAdmin($user)) {
            return response()->json(['success' => false, 'message' => 'This request has already been released.'], 422);
        }

        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $credentialRequest->fill($this->payload($request))->save();

        return response()->json([
            'success' => true,
            'message' => 'Request updated.',
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /** Library, laboratory or program head clearance. */
    public function approve(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'step' => ['nullable', 'string', Rule::in(self::SIGNABLE_STEPS)],
            'remarks' => 'required|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $step = $this->stepForUser($user, $request->input('step'));
        if (!$step || !in_array($step, self::SIGNABLE_STEPS, true)) {
            return response()->json(['success' => false, 'message' => 'You cannot sign this clearance.'], 403);
        }

        if ($credentialRequest->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'This request has been cancelled.'], 422);
        }

        if ($credentialRequest->{"{$step}_approved_at"}) {
            return response()->json(['success' => false, 'message' => 'This clearance has already been signed.'], 422);
        }

        $credentialRequest->{"{$step}_approved_at"} = now();
        $credentialRequest->{"{$step}_approved_by"} = $user->id;
        $credentialRequest->{"{$step}_remarks"} = $request->input('remarks');
        $credentialRequest->refreshStatus();
        $credentialRequest->save();

        return response()->json([
            'success' => true,
            'message' => $credentialRequest->clearanceComplete()
                ? 'Clearance signed. All clearances are complete — the request is now with the cashier.'
                : 'Clearance signed.',
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /** Cashier records the payment, which also files their approval. */
    public function processPayment(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Cashier'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the cashier can process this payment.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'or_number' => 'required|string|max:255',
            'payment_date' => 'required|date',
            'remarks' => 'required|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($credentialRequest->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'This request has been cancelled.'], 422);
        }

        if ($credentialRequest->cashier_approved_at) {
            return response()->json(['success' => false, 'message' => 'This request has already been paid.'], 422);
        }

        // The form is routed through the clearance desks before it reaches the
        // cashier; an admin may stand in when something has to move.
        if (!$credentialRequest->clearanceComplete() && !$this->isAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'The library, laboratory and program head have to clear this request before payment.',
            ], 422);
        }

        $credentialRequest->fill([
            'amount' => $request->amount,
            'or_number' => $request->or_number,
            'payment_date' => $request->payment_date,
            'cashier_approved_at' => now(),
            'cashier_approved_by' => $user->id,
            'cashier_remarks' => $request->remarks,
        ]);
        $credentialRequest->refreshStatus();
        $credentialRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded. The registrar can now release the documents.',
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /**
     * The registrar's last step: sign off, schedule the claiming, and send the
     * claim stub to the student. A mail failure does not undo the release —
     * the stub can be sent again from the board.
     */
    public function release(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the registrar can release credentials.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'claim_date' => 'required|date',
            'claim_time' => 'nullable|string|max:50',
            'remarks' => 'required|string|max:1000',
            'release_notes' => 'nullable|string|max:1000',
            'email' => 'nullable|email|max:255',
            'send_email' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($credentialRequest->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'This request has been cancelled.'], 422);
        }

        if (!$credentialRequest->cashier_approved_at && !$this->isAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'The payment has to be processed before the documents can be released.',
            ], 422);
        }

        $sendEmail = $request->boolean('send_email', true);

        // The stub is emailed, so a corrected address can be saved on the way out
        if ($request->filled('email')) {
            $credentialRequest->email = $request->input('email');
        }

        if ($sendEmail && !$credentialRequest->email) {
            return response()->json([
                'success' => false,
                'message' => 'This request has no email address — add one, or release without sending the stub.',
            ], 422);
        }

        $credentialRequest->fill([
            'claim_date' => $request->claim_date,
            'claim_time' => $request->claim_time,
            'release_notes' => $request->release_notes,
            'registrar_approved_at' => now(),
            'registrar_approved_by' => $user->id,
            'registrar_remarks' => $request->remarks,
            'released_at' => now(),
        ]);
        $credentialRequest->refreshStatus();
        $credentialRequest->save();

        $emailed = $sendEmail ? $this->sendClaimStub($credentialRequest) : null;

        return response()->json([
            'success' => true,
            'message' => match ($emailed) {
                true => "Released. The claim stub was emailed to {$credentialRequest->email}.",
                false => "Released, but the claim stub was not sent — {$this->mailError}. You can send it again from the board once mail is working.",
                default => 'Released. No claim stub email was sent.',
            },
            'email_sent' => $emailed,
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /** Sends the claim stub again, after a bad address or a mail outage. */
    public function resendEmail(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the registrar can send the claim stub.'], 403);
        }

        $validator = Validator::make($request->all(), ['email' => 'nullable|email|max:255']);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!$credentialRequest->released_at) {
            return response()->json(['success' => false, 'message' => 'This request has not been released yet.'], 422);
        }

        if ($request->filled('email')) {
            $credentialRequest->email = $request->input('email');
            $credentialRequest->save();
        }

        if (!$credentialRequest->email) {
            return response()->json(['success' => false, 'message' => 'This request has no email address.'], 422);
        }

        $sent = $this->sendClaimStub($credentialRequest);

        return response()->json([
            'success' => $sent,
            'message' => $sent
                ? "Claim stub sent to {$credentialRequest->email}."
                : "The claim stub could not be sent — {$this->mailError}.",
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ], $sent ? 200 : 502);
    }

    /** Undo a signature that was given by mistake (admin only). */
    public function revokeApproval(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$this->isAdmin($user)) {
            return response()->json(['success' => false, 'message' => 'Only an admin can undo an approval.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'step' => ['required', 'string', Rule::in(CredentialRequest::APPROVAL_STEPS)],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $step = $request->input('step');
        $credentialRequest->{"{$step}_approved_at"} = null;
        $credentialRequest->{"{$step}_approved_by"} = null;
        $credentialRequest->{"{$step}_remarks"} = null;

        // Withdrawing a clearance or the payment pulls back everything that
        // followed it, so the form has to travel the rest of the way again.
        if (in_array($step, CredentialRequest::CLEARANCE_STEPS, true)) {
            $this->clearSteps($credentialRequest, ['cashier', 'registrar']);
            $credentialRequest->fill(['amount' => null, 'or_number' => null, 'payment_date' => null]);
            $this->clearRelease($credentialRequest);
        } elseif ($step === 'cashier') {
            $this->clearSteps($credentialRequest, ['registrar']);
            $credentialRequest->fill(['amount' => null, 'or_number' => null, 'payment_date' => null]);
            $this->clearRelease($credentialRequest);
        } elseif ($step === 'registrar') {
            $this->clearRelease($credentialRequest);
        }

        $credentialRequest->refreshStatus();
        $credentialRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Approval withdrawn.',
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /** Cancels a request that should not go any further. */
    public function cancel(Request $request, CredentialRequest $credentialRequest): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Admin', 'Registrar'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the registrar can cancel a request.'], 403);
        }

        $validator = Validator::make($request->all(), ['remarks' => 'required|string|max:1000']);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $credentialRequest->status = 'cancelled';
        $credentialRequest->remarks = trim(($credentialRequest->remarks ? $credentialRequest->remarks . ' — ' : '')
            . 'Cancelled: ' . $request->input('remarks'));
        $credentialRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Request cancelled.',
            'data' => $this->format($credentialRequest->fresh(), $this->seesPayment($user)),
        ]);
    }

    /**
     * Students the registrar can file a request for. Alumni from before the
     * system are typed in by hand instead, so this is only a convenience.
     */
    public function searchStudents(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
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
                'course_name' => $student->course->course_name ?? null,
                'year_level' => $student->year,
                'semester' => $student->semester,
                'school_year' => $student->school_year,
                'email' => $student->email_address,
                'contact_number' => $student->contact_number,
            ]),
        ]);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private function rules(): array
    {
        return [
            'pre_enrolled_student_id' => 'nullable|exists:pre_enrolled_students,id',
            'student_name' => 'required|string|max:255',
            'student_id_number' => 'nullable|string|max:100',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:50',
            'semester' => 'nullable|string|max:50',
            'school_year' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'contact_number' => 'nullable|string|max:50',
            'credentials' => 'required|array|min:1',
            'credentials.*.type' => ['required', 'string', Rule::in(array_keys(CredentialRequest::CREDENTIAL_TYPES))],
            'credentials.*.label' => 'nullable|string|max:255',
            'credentials.*.pages' => 'nullable|integer|min:1|max:5',
            'credentials.*.remarks' => 'nullable|string|max:500',
            'purposes' => 'nullable|array',
            'purposes.*' => ['string', Rule::in(array_keys(CredentialRequest::PURPOSES))],
            'purpose_other' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:1000',
        ];
    }

    /** Normalises the submitted form into the columns we store. */
    private function payload(Request $request): array
    {
        $credentials = collect($request->input('credentials', []))->map(function ($line) {
            $type = $line['type'];
            $label = trim((string) ($line['label'] ?? '')) ?: (CredentialRequest::CREDENTIAL_TYPES[$type] ?? $type);

            return [
                'type' => $type,
                'label' => $label,
                'pages' => isset($line['pages']) && $line['pages'] !== '' ? (int) $line['pages'] : null,
                'remarks' => trim((string) ($line['remarks'] ?? '')) ?: null,
            ];
        })->values()->all();

        return [
            'pre_enrolled_student_id' => $request->input('pre_enrolled_student_id'),
            'student_name' => $request->input('student_name'),
            'student_id_number' => $request->input('student_id_number'),
            'course' => $request->input('course'),
            'year_level' => $request->input('year_level'),
            'semester' => $request->input('semester'),
            'school_year' => $request->input('school_year'),
            'email' => $request->input('email'),
            'contact_number' => $request->input('contact_number'),
            'credentials' => $credentials,
            'purposes' => array_values($request->input('purposes', []) ?? []),
            'purpose_other' => $request->input('purpose_other'),
            'remarks' => $request->input('remarks'),
        ];
    }

    private function stepForUser($user, ?string $requestedStep = null): ?string
    {
        if ($this->isAdmin($user)) {
            return $requestedStep;
        }

        $step = self::ROLE_STEPS[$user->role] ?? null;

        return ($requestedStep && $requestedStep !== $step) ? null : $step;
    }

    private function clearSteps(CredentialRequest $record, array $steps): void
    {
        foreach ($steps as $step) {
            $record->{"{$step}_approved_at"} = null;
            $record->{"{$step}_approved_by"} = null;
            $record->{"{$step}_remarks"} = null;
        }
    }

    private function clearRelease(CredentialRequest $record): void
    {
        $record->fill([
            'claim_date' => null,
            'claim_time' => null,
            'release_notes' => null,
            'released_at' => null,
            'email_sent_at' => null,
        ]);
    }

    /** True when the stub went out, false when mail failed. */
    private function sendClaimStub(CredentialRequest $record): bool
    {
        $this->mailError = null;

        try {
            Mail::to($record->email)->send(new CredentialClaimStubMail($record));
            $record->email_sent_at = now();
            $record->save();

            return true;
        } catch (\Throwable $e) {
            Log::error('Credential claim stub email failed', [
                'request_number' => $record->request_number,
                'error' => $e->getMessage(),
            ]);

            $this->mailError = $this->describeMailFailure($e);

            return false;
        }
    }

    /** Why the last send failed, so the UI can say more than "it didn't work". */
    private ?string $mailError = null;

    /**
     * Turns a mail exception into something a registrar can act on. The system
     * is self-hosted, so "no mail server configured" is the usual answer and
     * saying so saves a trip to the logs.
     */
    private function describeMailFailure(\Throwable $e): string
    {
        $message = $e->getMessage();
        $host = config('mail.mailers.' . config('mail.default') . '.host');
        $port = config('mail.mailers.' . config('mail.default') . '.port');

        if (str_contains($message, 'getaddrinfo') || str_contains($message, 'Connection could not be established')) {
            return "the mail server ({$host}:{$port}) could not be reached — it is not set up yet";
        }

        if (str_contains($message, 'Authentication') || str_contains($message, '535')) {
            return 'the mail server rejected the username or password';
        }

        return 'the mail server returned an error';
    }

    /** One lookup for every approver's name across a set of requests. */
    private function nameMap($records): array
    {
        $records = is_iterable($records) ? $records : [$records];

        $ids = collect($records)
            ->flatMap(function ($record) {
                $ids = array_map(fn ($step) => $record->{"{$step}_approved_by"}, CredentialRequest::APPROVAL_STEPS);
                $ids[] = $record->created_by;

                return $ids;
            })
            ->filter()
            ->unique()
            ->values();

        return $ids->isEmpty() ? [] : User::whereIn('id', $ids)->pluck('name', 'id')->all();
    }

    /** Shapes a request for the board, the printed form and the claim stub. */
    private function format(CredentialRequest $record, bool $seesPayment = true, ?array $names = null): array
    {
        $names ??= $this->nameMap([$record]);

        $approvals = [];
        $approvalNames = [];
        $approvalRemarks = [];

        foreach (CredentialRequest::APPROVAL_STEPS as $step) {
            $approvals[$step] = $record->{"{$step}_approved_at"}?->toDateTimeString();
            $approvalNames[$step] = $names[$record->{"{$step}_approved_by"}] ?? null;
            // The cashier's note can carry payment details with it
            $approvalRemarks[$step] = ($step === 'cashier' && !$seesPayment)
                ? null
                : $record->{"{$step}_remarks"};
        }

        return [
            'id' => $record->id,
            'request_number' => $record->request_number,
            'status' => $record->status,
            'student' => [
                'id' => $record->pre_enrolled_student_id,
                'name' => $record->student_name,
                'student_id_number' => $record->student_id_number,
                'course' => $record->course,
                'year_level' => $record->year_level,
                'semester' => $record->semester,
                'school_year' => $record->school_year,
                'email' => $record->email,
                'contact_number' => $record->contact_number,
                'is_linked' => (bool) $record->pre_enrolled_student_id,
            ],
            'credentials' => $record->credentialLines(),
            'purposes' => $record->purposes ?? [],
            'purpose_labels' => $record->purposeLabels(),
            'purpose_other' => $record->purpose_other,
            'remarks' => $record->remarks,
            'payment' => [
                'amount' => $seesPayment ? $record->amount : null,
                'or_number' => $seesPayment ? $record->or_number : null,
                'payment_date' => $seesPayment ? optional($record->payment_date)->toDateString() : null,
                'is_paid' => (bool) $record->cashier_approved_at,
                'visible' => $seesPayment,
            ],
            'approvals' => $approvals,
            'approval_names' => $approvalNames,
            'approval_remarks' => $approvalRemarks,
            'claim' => [
                'date' => optional($record->claim_date)->toDateString(),
                'time' => $record->claim_time,
                'notes' => $record->release_notes,
                'released_at' => $record->released_at?->toDateTimeString(),
                'email_sent_at' => $record->email_sent_at?->toDateTimeString(),
            ],
            'clearance_complete' => $record->clearanceComplete(),
            'is_fully_approved' => $record->isFullyApproved(),
            'created_by' => $names[$record->created_by] ?? null,
            'created_at' => $record->created_at?->toDateTimeString(),
            'requested_on' => $record->created_at?->toDateString(),
        ];
    }
}
