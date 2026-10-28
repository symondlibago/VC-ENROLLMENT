<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A school year the registrar can enrol into, e.g. "2026-2027". */
class SchoolYear extends Model
{
    protected $fillable = ['name', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Newest first — "2027-2028" sorts above "2026-2027" as a string. */
    public function scopeNewestFirst($query)
    {
        return $query->orderByDesc('name');
    }
}
