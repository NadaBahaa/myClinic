<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Service extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'uuid', 'name', 'category', 'duration', 'price', 'description', 'popular',
    ];

    protected $casts = [
        'price'    => 'float',
        'duration' => 'integer',
        'popular'  => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function practitionerTypes()
    {
        return $this->belongsToMany(PractitionerType::class, 'service_practitioner_type');
    }

    public function appointments()
    {
        return $this->belongsToMany(Appointment::class, 'appointment_service')->withPivot('service_name');
    }
}
