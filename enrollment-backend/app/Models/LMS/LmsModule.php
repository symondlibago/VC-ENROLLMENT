<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Subject;

class LmsModule extends Model
{
    protected $table = 'lms_modules';

    protected $fillable = [
        'subject_id',
        'section_id',
        'created_by',
        'title',
        'description',
        'order_index',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'order_index' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function section()
    {
        return $this->belongsTo(\App\Models\Section::class, 'section_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function files()
    {
        return $this->hasMany(LmsModuleFile::class, 'module_id');
    }

    public function assignments()
    {
        return $this->hasMany(LmsAssignment::class, 'module_id');
    }
}
