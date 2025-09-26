<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectChangeRequest extends Model {
    use HasFactory;
    protected $fillable = ['pre_enrolled_student_id', 'status', 'rejection_remarks', 'processed_by_program_head', 'processed_by_cashier'];

    public function student() {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function items() {
        return $this->hasMany(SubjectChangeRequestItem::class);
    }
}