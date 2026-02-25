<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $sarah   = Doctor::where('uuid', 'doc-00000-0000-0000-000000000001')->first();
        $michael = Doctor::where('uuid', 'doc-00000-0000-0000-000000000002')->first();

        $emma    = Patient::where('uuid', 'pat-00000-0000-0000-000000000001')->first();
        $olivia  = Patient::where('uuid', 'pat-00000-0000-0000-000000000002')->first();
        $sophia  = Patient::where('uuid', 'pat-00000-0000-0000-000000000003')->first();
        $ava     = Patient::where('uuid', 'pat-00000-0000-0000-000000000004')->first();

        $facial      = Service::where('uuid', 'svc-00000-0000-0000-000000000001')->first();
        $laser       = Service::where('uuid', 'svc-00000-0000-0000-000000000002')->first();
        $botox       = Service::where('uuid', 'svc-00000-0000-0000-000000000003')->first();
        $chemPeel    = Service::where('uuid', 'svc-00000-0000-0000-000000000004')->first();
        $fillers     = Service::where('uuid', 'svc-00000-0000-0000-000000000006')->first();

        $today    = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();

        $appointments = [
            // Today's appointments
            [
                'uuid'       => 'apt-00000-0000-0000-000000000001',
                'patient_id' => $emma?->id,
                'doctor_id'  => $sarah?->id,
                'date'       => $today,
                'start_time' => '09:00:00',
                'end_time'   => '10:00:00',
                'duration'   => 60,
                'status'     => 'scheduled',
                'notes'      => 'Follow-up facial treatment',
                'services'   => [$facial],
            ],
            [
                'uuid'       => 'apt-00000-0000-0000-000000000002',
                'patient_id' => $olivia?->id,
                'doctor_id'  => $michael?->id,
                'date'       => $today,
                'start_time' => '10:30:00',
                'end_time'   => '11:00:00',
                'duration'   => 30,
                'status'     => 'scheduled',
                'notes'      => 'Regular Botox treatment',
                'services'   => [$botox],
            ],
            [
                'uuid'       => 'apt-00000-0000-0000-000000000003',
                'patient_id' => $sophia?->id,
                'doctor_id'  => $sarah?->id,
                'date'       => $today,
                'start_time' => '14:00:00',
                'end_time'   => '15:00:00',
                'duration'   => 60,
                'status'     => 'scheduled',
                'notes'      => 'Chemical peel for acne scarring',
                'services'   => [$chemPeel],
            ],
            // Tomorrow's appointments
            [
                'uuid'       => 'apt-00000-0000-0000-000000000004',
                'patient_id' => $ava?->id,
                'doctor_id'  => $sarah?->id,
                'date'       => $tomorrow,
                'start_time' => '11:00:00',
                'end_time'   => '12:00:00',
                'duration'   => 60,
                'status'     => 'scheduled',
                'notes'      => 'Facial treatment consultation',
                'services'   => [$facial],
            ],
            [
                'uuid'       => 'apt-00000-0000-0000-000000000005',
                'patient_id' => $emma?->id,
                'doctor_id'  => $michael?->id,
                'date'       => $tomorrow,
                'start_time' => '14:00:00',
                'end_time'   => '14:45:00',
                'duration'   => 45,
                'status'     => 'scheduled',
                'notes'      => 'Dermal fillers for lip augmentation',
                'services'   => [$fillers],
            ],
        ];

        foreach ($appointments as $data) {
            $services = $data['services'] ?? [];
            unset($data['services']);

            if (! $data['patient_id'] || ! $data['doctor_id']) continue;

            $appt = Appointment::updateOrCreate(['uuid' => $data['uuid']], $data);

            // Sync services
            $syncData = collect($services)
                ->filter()
                ->mapWithKeys(fn($s) => [$s->id => ['service_name' => $s->name]])
                ->toArray();
            $appt->services()->sync($syncData);
        }
    }
}
