<?php

namespace App\Models\LMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class LmsModuleFile extends Model
{
    protected $table = 'lms_module_files';

    protected $fillable = [
        'module_id',
        'uploaded_by',
        'original_name',
        'storage_path',
        'mime_type',
        'size_bytes',
        'extension',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(LmsModule::class, 'module_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
