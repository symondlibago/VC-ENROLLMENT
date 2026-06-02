<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use App\Models\User;

class LmsSubmission extends Model
{
    protected $table = 'lms_submissions';

    protected $fillable = [
        'assignment_id',
        'student_user_id',
        'original_name',
        'storage_path',
        'mime_type',
        'size_bytes',
        'extension',
        'submitted_at',
        'score',
        'feedback',
        'graded_by',
        'graded_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
        'size_bytes' => 'integer',
        'score' => 'float',
    ];

    public function assignment()
    {
        return $this->belongsTo(LmsAssignment::class, 'assignment_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_user_id');
    }

    public function grader()
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    /**
     * Work out how late a submission is relative to a due date.
     * Returns ['is_late' => bool, 'days_late' => int] where days_late is the
     * number of whole 24h periods past the deadline (0 = late but within a day).
     */
    public static function computeLate($dueAt, $submittedAt): array
    {
        if (!$dueAt || !$submittedAt) {
            return ['is_late' => false, 'days_late' => 0];
        }

        $due = $dueAt instanceof Carbon ? $dueAt : Carbon::parse($dueAt);
        $submitted = $submittedAt instanceof Carbon ? $submittedAt : Carbon::parse($submittedAt);

        if ($submitted->lessThanOrEqualTo($due)) {
            return ['is_late' => false, 'days_late' => 0];
        }

        $secondsLate = $submitted->getTimestamp() - $due->getTimestamp();

        return ['is_late' => true, 'days_late' => intdiv($secondsLate, 86400)];
    }
}
