<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One signature line on the clearance form, e.g. Librarian. */
class ClearanceRole extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'scope', 'alt_role_id', 'is_final', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_final' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /** The cashier's line, which only opens once the rest are signed. */
    public const FINAL_CODE = 'cashier';

    /** Whose form a line belongs on. */
    public const SCOPE_STUDENT = 'student';
    public const SCOPE_FACULTY = 'faculty';
    public const SCOPES = [self::SCOPE_STUDENT, self::SCOPE_FACULTY];

    /**
     * A line whose holders may also sign this one.
     *
     * Only the faculty TESDA In-Charge line uses it, which the Registrar may
     * sign in their place. Deliberately one-way: holding the TESDA line does
     * not let you sign for the Registrar.
     */
    public function altRole(): BelongsTo
    {
        return $this->belongsTo(self::class, 'alt_role_id');
    }

    public function scopeForScope($query, string $scope)
    {
        return $query->where('scope', $scope);
    }

    public function scopeForStudents($query)
    {
        return $query->where('scope', self::SCOPE_STUDENT);
    }

    public function scopeForFaculty($query)
    {
        return $query->where('scope', self::SCOPE_FACULTY);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'clearance_role_user')
            ->withPivot('assigned_by')
            ->withTimestamps();
    }

    public function items(): HasMany
    {
        return $this->hasMany(ClearanceItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInFormOrder($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}
