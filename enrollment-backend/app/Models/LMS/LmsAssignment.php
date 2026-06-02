<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class LmsAssignment extends Model
{
    protected $table = 'lms_assignments';

    protected $fillable = [
        'module_id',
        'created_by',
        'title',
        'instructions',
        'due_at',
        'allow_late',
        'max_score',
        'is_published',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'allow_late' => 'boolean',
        'is_published' => 'boolean',
        'max_score' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(LmsModule::class, 'module_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions()
    {
        return $this->hasMany(LmsSubmission::class, 'assignment_id');
    }
}
