<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PatientFile extends Model
{
    use SoftDeletes;
    protected $fillable = ['uuid', 'patient_id', 'doctor_id'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function sessions()
    {
        return $this->hasMany(SessionRecord::class);
    }

    public function photos()
    {
        return $this->hasMany(PatientPhoto::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function attachments()
    {
        return $this->hasMany(PatientFileAttachment::class);
    }

    /**
     * Get or create the patient file for a given patient+doctor pair.
     */
    public static function getOrCreate(int $patientId, int $doctorId): self
    {
        return self::firstOrCreate(
            ['patient_id' => $patientId, 'doctor_id' => $doctorId],
            ['uuid' => (string) Str::uuid()]
        );
    }
}
