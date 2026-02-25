<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Doctor extends Model
{
    protected $fillable = [
        'uuid', 'user_id', 'practitioner_type_id', 'name', 'email', 'phone',
        'specialty', 'experience', 'qualifications', 'license_number',
        'availability', 'total_patients', 'custom_permissions',
    ];

    protected $casts = [
        'availability'       => 'array',
        'custom_permissions' => 'array',
        'experience'         => 'integer',
        'total_patients'     => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function practitionerType()
    {
        return $this->belongsTo(PractitionerType::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function patientFiles()
    {
        return $this->hasMany(PatientFile::class);
    }
}
