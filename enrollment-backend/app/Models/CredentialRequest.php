<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A student's request for school credentials (VIPC-RO-15).
 *
 * The request is encoded by the registrar, cleared by the library, laboratory
 * and program head, paid at the cashier, then released by the registrar with a
 * claim schedule that is emailed to the student.
 */
class CredentialRequest extends Model
{
    use HasFactory;

    /** Documents that can be requested. Add new ones here and they appear everywhere. */
    public const CREDENTIAL_TYPES = [
        'honorable_dismissal' => 'Honorable Dismissal',
        'certification_of_enrollment' => 'Certification of Enrollment',
        'certification_of_completion' => 'Certification of Completion',
        'certification_of_units_earned' => 'Certification of Units Earned',
        'transcript_of_records' => 'Official Transcript of Records',
        'good_moral' => 'Certificate of Good Moral',
        'diploma' => 'Diploma',
        'others' => 'Others',
    ];

    /** Why the credentials are being requested. */
    public const PURPOSES = [
        'employment' => 'For Employment',
        'enrollment' => 'For Enrollment',
        'reference' => 'Reference',
        'evaluation' => 'Evaluation',
        'scholarship' => 'Scholarship',
        'others' => 'Others',
    ];

    /** Every desk that signs the form, in routing order. */
    public const APPROVAL_STEPS = ['librarian', 'laboratory', 'program_head', 'cashier', 'registrar'];

    /** The clearance desks, which may sign in any order before payment. */
    public const CLEARANCE_STEPS = ['librarian', 'laboratory', 'program_head'];

    protected $fillable = [
        'request_number',
        'pre_enrolled_student_id',
        'student_name',
        'student_id_number',
        'course',
        'year_level',
        'semester',
        'school_year',
        'email',
        'contact_number',
        'credentials',
        'purposes',
        'purpose_other',
        'remarks',
        'status',
        'amount',
        'or_number',
        'payment_date',
        'librarian_approved_at', 'librarian_approved_by', 'librarian_remarks',
        'laboratory_approved_at', 'laboratory_approved_by', 'laboratory_remarks',
        'program_head_approved_at', 'program_head_approved_by', 'program_head_remarks',
        'cashier_approved_at', 'cashier_approved_by', 'cashier_remarks',
        'registrar_approved_at', 'registrar_approved_by', 'registrar_remarks',
        'claim_date',
        'claim_time',
        'release_notes',
        'released_at',
        'email_sent_at',
        'created_by',
    ];

    protected $casts = [
        'credentials' => 'array',
        'purposes' => 'array',
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'claim_date' => 'date',
        'librarian_approved_at' => 'datetime',
        'laboratory_approved_at' => 'datetime',
        'program_head_approved_at' => 'datetime',
        'cashier_approved_at' => 'datetime',
        'registrar_approved_at' => 'datetime',
        'released_at' => 'datetime',
        'email_sent_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $request) {
            if (!$request->request_number) {
                $request->request_number = self::nextRequestNumber();
            }
        });
    }

    /** Running number per year, e.g. CR-2026-0007. */
    public static function nextRequestNumber(): string
    {
        $year = date('Y');
        $last = self::where('request_number', 'like', "CR-{$year}-%")
            ->orderByDesc('id')
            ->value('request_number');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return sprintf('CR-%s-%04d', $year, $next);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Library, laboratory and program head have all signed. */
    public function clearanceComplete(): bool
    {
        foreach (self::CLEARANCE_STEPS as $step) {
            if (!$this->{"{$step}_approved_at"}) {
                return false;
            }
        }

        return true;
    }

    public function isFullyApproved(): bool
    {
        foreach (self::APPROVAL_STEPS as $step) {
            if (!$this->{"{$step}_approved_at"}) {
                return false;
            }
        }

        return true;
    }

    /**
     * Keeps the status in step with how far the form has travelled, so the
     * board always reflects which desk the request is sitting on.
     */
    public function refreshStatus(): void
    {
        if ($this->status === 'cancelled') {
            return;
        }

        if ($this->released_at) {
            $this->status = 'released';
        } elseif ($this->cashier_approved_at) {
            $this->status = 'ready_to_release';
        } elseif ($this->clearanceComplete()) {
            $this->status = 'awaiting_payment';
        } else {
            $this->status = 'pending';
        }
    }

    /** The requested documents with their printable labels. */
    public function credentialLines(): array
    {
        return collect($this->credentials ?? [])->map(function ($line) {
            $type = $line['type'] ?? 'others';

            return [
                'type' => $type,
                'label' => $line['label'] ?? (self::CREDENTIAL_TYPES[$type] ?? $type),
                'pages' => $line['pages'] ?? null,
                'remarks' => $line['remarks'] ?? null,
            ];
        })->all();
    }

    /** Purposes written out, with the free-text one appended when chosen. */
    public function purposeLabels(): array
    {
        return collect($this->purposes ?? [])->map(function ($purpose) {
            if ($purpose === 'others') {
                return $this->purpose_other
                    ? "Others: {$this->purpose_other}"
                    : 'Others';
            }

            return self::PURPOSES[$purpose] ?? $purpose;
        })->all();
    }
}
