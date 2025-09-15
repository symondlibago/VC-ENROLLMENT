<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentCode extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pre_enrolled_student_id',
        'code',
        'is_used',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_used' => 'boolean',
    ];

    /**
     * Get the pre-enrolled student that owns the enrollment code.
     */
    public function preEnrolledStudent(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class);
    }

    /**
     * Generate a unique enrollment code.
     *
     * @return string
     */
    public static function generateUniqueCode(): string
    {
        $year = date('Y');
        $prefix = "VIPC-{$year}-";
        
        do {
            // Generate random parts: XXXX-XXX
            $firstPart = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $secondPart = str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            
            $code = $prefix . $firstPart . '-' . $secondPart;
            
            // Check if code already exists
            $exists = self::where('code', $code)->exists();
        } while ($exists);
        
        return $code;
    }
}