<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Something the ID desk stocks — a sling, a holder, blank card stock. */
class IdSupplyItem extends Model
{
    protected $fillable = [
        'code',
        'name',
        'category',
        'description',
        'low_stock_quantity',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'low_stock_quantity' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public const CATEGORIES = ['sling', 'holder', 'card', 'other'];

    public function deliveries(): HasMany
    {
        return $this->hasMany(IdSupplyDelivery::class);
    }

    public function issuances(): HasMany
    {
        return $this->hasMany(IdSupplyIssuance::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
