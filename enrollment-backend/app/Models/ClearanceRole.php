<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One signature line on the clearance form, e.g. Librarian. */
class ClearanceRole extends Model
{
    protected $fillable = ['code', 'name', 'description', 'is_final', 'sort_order', 'is_active'];

    protected $casts = [
        'is_final' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /** The cashier's line, which only opens once the rest are signed. */
    public const FINAL_CODE = 'cashier';

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
