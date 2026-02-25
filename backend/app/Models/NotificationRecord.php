<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NotificationRecord extends Model
{
    protected $fillable = [
        'uuid', 'patient_id', 'appointment_id', 'type', 'sent_at', 'sent_by', 'method', 'status',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
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

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
