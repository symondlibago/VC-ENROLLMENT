<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Subject;

class LmsNotification extends Model
{
    protected $table = 'lms_notifications';

    protected $fillable = [
        'user_id',
        'subject_id',
        'type',
        'title',
        'body',
        'link',
        'payload',
        'read_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
