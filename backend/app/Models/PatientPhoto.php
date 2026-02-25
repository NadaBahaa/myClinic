<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PatientPhoto extends Model
{
    protected $fillable = [
        'uuid', 'patient_file_id', 'session_id', 'url', 'type', 'uploaded_by', 'notes',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function patientFile()
    {
        return $this->belongsTo(PatientFile::class);
    }

    public function session()
    {
        return $this->belongsTo(SessionRecord::class, 'session_id');
    }
}
