<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Subject;
use App\Models\Section;

class LmsAnnouncement extends Model
{
    protected $table = 'lms_announcements';

    protected $fillable = [
        'subject_id',
        'section_id',
        'created_by',
        'title',
        'body',
        'pinned',
    ];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
