<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Prescription extends Model
{
    protected $fillable = [
        'uuid', 'patient_file_id', 'name', 'dosage', 'frequency',
        'duration', 'url', 'prescribed_by', 'notes',
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
}
