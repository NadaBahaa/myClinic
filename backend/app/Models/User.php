<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'uuid', 'name', 'email', 'password', 'role', 'is_active', 'practitioner_type_id',
        'perm_show_calendar', 'perm_show_patients', 'perm_show_doctors',
        'perm_show_services', 'perm_show_users', 'perm_show_settings',
        'perm_show_activity_log', 'perm_show_reports', 'perm_show_materials_tools', 'perm_show_practitioner_types',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'password'                     => 'hashed',
        'is_active'                    => 'boolean',
        'perm_show_calendar'           => 'boolean',
        'perm_show_patients'           => 'boolean',
        'perm_show_doctors'            => 'boolean',
        'perm_show_services'           => 'boolean',
        'perm_show_users'              => 'boolean',
        'perm_show_settings'           => 'boolean',
        'perm_show_activity_log'       => 'boolean',
        'perm_show_reports'            => 'boolean',
        'perm_show_materials_tools'    => 'boolean',
        'perm_show_practitioner_types' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static function ($model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    public function getPermissionsAttribute(): array
    {
        return [
            'showCalendar'         => $this->perm_show_calendar,
            'showPatients'         => $this->perm_show_patients,
            'showDoctors'         => $this->perm_show_doctors,
            'showServices'        => $this->perm_show_services,
            'showUsers'           => $this->perm_show_users,
            'showSettings'        => $this->perm_show_settings,
            'showActivityLog'     => $this->perm_show_activity_log ?? false,
            'showReports'         => $this->perm_show_reports ?? false,
            'showMaterialsTools'  => $this->perm_show_materials_tools ?? false,
            'showPractitionerTypes' => $this->perm_show_practitioner_types ?? false,
        ];
    }

    public function practitionerType()
    {
        return $this->belongsTo(PractitionerType::class);
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }
}
