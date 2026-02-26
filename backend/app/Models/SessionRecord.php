<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SessionRecord extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'uuid', 'patient_file_id', 'appointment_id', 'date',
        'service_id', 'service_name', 'service_price',
        'total_materials_cost', 'net_profit', 'performed_by', 'notes',
    ];

    protected $casts = [
        'date'                 => 'date',
        'service_price'        => 'float',
        'total_materials_cost' => 'float',
        'net_profit'           => 'float',
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

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function materialUsages()
    {
        return $this->hasMany(SessionMaterialUsage::class);
    }

    public function photos()
    {
        return $this->hasMany(PatientPhoto::class, 'session_id');
    }
}
