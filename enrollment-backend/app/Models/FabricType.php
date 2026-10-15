<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A fabric the school stocks — male upper, female upper, the shared lower. */
class FabricType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'low_stock_meters',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'low_stock_meters' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function deliveries(): HasMany
    {
        return $this->hasMany(FabricDelivery::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(FabricPurchaseItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
