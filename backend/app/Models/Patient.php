<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Patient extends Model
{
    protected $fillable = [
        'uuid', 'name', 'email', 'phone', 'date_of_birth',
        'address', 'emergency_contact', 'notes', 'last_visit', 'total_visits',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'last_visit'    => 'date',
        'total_visits'  => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function patientFiles()
    {
        return $this->hasMany(PatientFile::class);
    }

    public function notifications()
    {
        return $this->hasMany(NotificationRecord::class);
    }
}
