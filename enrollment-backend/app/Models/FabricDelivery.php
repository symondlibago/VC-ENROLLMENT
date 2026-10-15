<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A batch of fabric received — so many rolls, so many metres, on a date. */
class FabricDelivery extends Model
{
    protected $fillable = [
        'fabric_type_id',
        'delivery_date',
        'rolls',
        'meters',
        'supplier',
        'reference',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'rolls' => 'integer',
        'meters' => 'decimal:2',
    ];

    public function fabricType(): BelongsTo
    {
        return $this->belongsTo(FabricType::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
