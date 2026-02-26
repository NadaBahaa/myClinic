<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PatientFileAttachment extends Model
{
    protected $fillable = [
        'uuid', 'patient_file_id', 'session_record_id',
        'name', 'path', 'mime_type', 'uploaded_by_user_id',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn ($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function patientFile()
    {
        return $this->belongsTo(PatientFile::class);
    }

    public function sessionRecord()
    {
        return $this->belongsTo(SessionRecord::class);
    }
}
