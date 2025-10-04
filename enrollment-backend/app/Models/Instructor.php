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