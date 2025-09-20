<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'user_id',
        'role',
        'status',
        'remarks',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the student associated with the approval.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    /**
     * Get the user who made the approval.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
