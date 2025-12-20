<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'day',
        'time',
        'room_no',
        'instructor_id',
        'subject_id',
        'section_id',
    ];

    protected $casts = [
        'subject_id' => 'integer',
        'section_id' => 'integer', 
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class);
    }

    // NEW RELATIONSHIP
    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}