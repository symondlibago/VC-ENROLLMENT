<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UploadReceipt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pre_enrolled_student_id',
        'receipt_photo_path',
    ];

    /**
     * Get the student associated with the uploaded receipt.
     */
    public function preEnrolledStudent(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class);
    }
}