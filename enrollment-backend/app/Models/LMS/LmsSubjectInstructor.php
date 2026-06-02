<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Subject;

class LmsSubjectInstructor extends Model
{
    protected $table = 'lms_subject_instructor';

    protected $fillable = [
        'subject_id',
        'user_id',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
