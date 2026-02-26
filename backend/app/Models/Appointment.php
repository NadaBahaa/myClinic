<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Appointment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'uuid', 'patient_id', 'doctor_id', 'date', 'start_time',
        'end_time', 'duration', 'status', 'notes',
    ];

    protected $casts = [
        'date'     => 'date',
        'duration' => 'integer',
    ];

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

    public function services()
    {
        return $this->belongsToMany(Service::class, 'appointment_service')->withPivot('service_name');
    }

    public function sessionRecord()
    {
        return $this->hasOne(SessionRecord::class);
    }

    public function notifications()
    {
        return $this->hasMany(NotificationRecord::class);
    }
}
