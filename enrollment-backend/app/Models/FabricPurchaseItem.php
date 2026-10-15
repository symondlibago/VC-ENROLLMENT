<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** How many metres of one fabric a purchase covered. */
class FabricPurchaseItem extends Model
{
    protected $fillable = [
        'fabric_purchase_id',
        'fabric_type_id',
        'meters',
    ];

    protected $casts = [
        'meters' => 'decimal:2',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(FabricPurchase::class, 'fabric_purchase_id');
    }

    public function fabricType(): BelongsTo
    {
        return $this->belongsTo(FabricType::class);
    }
}
