<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Stock coming in — so many slings or holders received on a date. */
class IdSupplyDelivery extends Model
{
    protected $fillable = [
        'id_supply_item_id',
        'delivery_date',
        'quantity',
        'unit_cost',
        'supplier',
        'reference',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(IdSupplyItem::class, 'id_supply_item_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
