<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\SessionRecord;
use App\Policies\AppointmentPolicy;
use App\Policies\NotificationRecordPolicy;
use App\Policies\PatientFilePolicy;
use App\Policies\PatientPolicy;
use App\Policies\SessionRecordPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Patient::class       => PatientPolicy::class,
        PatientFile::class   => PatientFilePolicy::class,
        SessionRecord::class => SessionRecordPolicy::class,
        Appointment::class   => AppointmentPolicy::class,
        NotificationRecord::class => NotificationRecordPolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
