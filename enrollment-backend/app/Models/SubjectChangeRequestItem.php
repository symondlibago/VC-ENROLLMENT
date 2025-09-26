<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectChangeRequestItem extends Model {
    use HasFactory;
    protected $fillable = ['subject_change_request_id', 'subject_id', 'action'];

    public function subject() {
        return $this->belongsTo(Subject::class);
    }
}