<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One signature line on one student's clearance. */
class ClearanceItem extends Model
{
    protected $fillable = [
        'clearance_id',
        'clearance_role_id',
        'status',
        'approved_by',
        'approved_at',
        'on_behalf',
        'remarks',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'on_behalf' => 'boolean',
    ];

    public function clearance(): BelongsTo
    {
        return $this->belongsTo(Clearance::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(ClearanceRole::class, 'clearance_role_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}
