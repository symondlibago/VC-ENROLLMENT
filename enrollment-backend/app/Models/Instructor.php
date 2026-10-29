<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Instructor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'title',
        'department',
        'email',
        'status',
        'is_featured',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
    ];

    /**
     * The teaching levels, as slug => label.
     *
     * The column holds the slug; screens show the label. Printing the slug is
     * how "deiploma" reached a page — the dialog that wrote it showed
     * "Diploma" and stored the misspelling, and nothing read it back until
     * the faculty board did.
     */
    public const DEPARTMENTS = [
        'diploma' => 'Diploma',
        'bachelor' => 'Bachelor',
        'shs' => 'Senior High School',
    ];

    /**
     * The department as a person should read it.
     *
     * Anything filed outside the list — a desk such as "Registrar" — is shown
     * as entered rather than forced into a label it does not have.
     */
    public function getDepartmentLabelAttribute(): ?string
    {
        $value = trim((string) $this->department);

        if ($value === '') {
            return null;
        }

        return self::DEPARTMENTS[strtolower($value)] ?? $value;
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}