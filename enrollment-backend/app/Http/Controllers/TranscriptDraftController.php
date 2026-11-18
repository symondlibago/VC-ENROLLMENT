<?php

namespace App\Http\Controllers;

use App\Models\PreEnrolledStudent;
use App\Models\TranscriptDraft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * Unfinished transcripts.
 *
 * A registrar building a transcript for an older student has to go and find
 * things — in the filing cabinet, in another office, from the student. This
 * keeps the form as it stood so the search can take as long as it takes.
 *
 * Drafts belong to whoever saved them. An admin sees all of them, because
 * somebody has to be able to pick up the work when the registrar is away.
 */
class TranscriptDraftController extends Controller
{
    /** The same desks that may pull a record may keep a draft of one. */
    private const DESK_ROLES = ['Admin', 'Registrar'];

    /** A draft holds a whole typed transcript, so the cap is generous. */
    private const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

    private function denyUnlessDesk(): ?JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role, self::DESK_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return null;
    }

    /** Whether this user may open or change this particular draft. */
    private function owns(TranscriptDraft $draft): bool
    {
        $user = Auth::user();

        return $user && ((int) $draft->user_id === (int) $user->id || $user->role === 'Admin');
    }

    public function index(): JsonResponse
    {
        if ($denied = $this->denyUnlessDesk()) {
            return $denied;
        }

        $user = Auth::user();

        $drafts = TranscriptDraft::with('user:id,name')
            // An admin is covering for everyone; a registrar sees their own.
            ->when($user->role !== 'Admin', fn ($q) => $q->where('user_id', $user->id))
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get()
            ->map(fn (TranscriptDraft $draft) => $draft->summary());

        return response()->json(['success' => true, 'data' => $drafts]);
    }

    public function show(TranscriptDraft $transcriptDraft): JsonResponse
    {
        if ($denied = $this->denyUnlessDesk()) {
            return $denied;
        }

        if (!$this->owns($transcriptDraft)) {
            return response()->json(['success' => false, 'message' => 'That draft is not yours.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $transcriptDraft->summary() + ['payload' => $transcriptDraft->payload],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessDesk()) {
            return $denied;
        }

        $validated = $this->validatePayload($request);

        if ($validated instanceof JsonResponse) {
            return $validated;
        }

        $draft = TranscriptDraft::create([
            'user_id' => Auth::id(),
            'pre_enrolled_student_id' => $this->studentIdFrom($validated['payload']),
            'title' => $validated['title'],
            'payload' => $validated['payload'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Draft saved as \"{$draft->title}\".",
            'data' => $draft->load('user:id,name')->summary(),
        ], 201);
    }

    public function update(Request $request, TranscriptDraft $transcriptDraft): JsonResponse
    {
        if ($denied = $this->denyUnlessDesk()) {
            return $denied;
        }

        if (!$this->owns($transcriptDraft)) {
            return response()->json(['success' => false, 'message' => 'That draft is not yours.'], 403);
        }

        $validated = $this->validatePayload($request);

        if ($validated instanceof JsonResponse) {
            return $validated;
        }

        $transcriptDraft->update([
            'pre_enrolled_student_id' => $this->studentIdFrom($validated['payload']),
            'title' => $validated['title'],
            'payload' => $validated['payload'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Draft updated.',
            'data' => $transcriptDraft->load('user:id,name')->summary(),
        ]);
    }

    public function destroy(TranscriptDraft $transcriptDraft): JsonResponse
    {
        if ($denied = $this->denyUnlessDesk()) {
            return $denied;
        }

        if (!$this->owns($transcriptDraft)) {
            return response()->json(['success' => false, 'message' => 'That draft is not yours.'], 403);
        }

        $title = $transcriptDraft->title;
        $transcriptDraft->delete();

        return response()->json(['success' => true, 'message' => "Draft \"{$title}\" deleted."]);
    }

    /**
     * @return array{title: string, payload: array}|JsonResponse
     */
    private function validatePayload(Request $request): array|JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payload' => 'required|array',
            'title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $payload = $request->input('payload');

        // A typed transcript is big but not unbounded. Refusing with a reason
        // beats a truncated column or a 500 from the JSON encoder.
        if (strlen(json_encode($payload)) > self::MAX_PAYLOAD_BYTES) {
            return response()->json([
                'success' => false,
                'message' => 'That draft is too large to save. Generate it now, or split the record.',
            ], 422);
        }

        $title = trim((string) $request->input('title'));

        return [
            'title' => $title !== '' ? mb_substr($title, 0, 255) : TranscriptDraft::titleFrom($payload),
            'payload' => $payload,
        ];
    }

    /**
     * The student the draft is about, when they are still on file.
     *
     * Checked rather than trusted: the id travels in the payload the browser
     * sends, and a stale one would break the foreign key on save.
     */
    private function studentIdFrom(array $payload): ?int
    {
        $id = data_get($payload, 'student.pre_enrolled_student_id');

        if (!$id || !is_numeric($id)) {
            return null;
        }

        return PreEnrolledStudent::whereKey((int) $id)->exists() ? (int) $id : null;
    }
}
