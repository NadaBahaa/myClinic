<?php

namespace Database\Seeders;

use App\Models\Patient;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            [
                'uuid'          => 'pat-00000-0000-0000-000000000001',
                'name'          => 'Emma Wilson',
                'email'         => 'emma.wilson@email.com',
                'phone'         => '+1 (555) 123-4567',
                'date_of_birth' => '1990-03-15',
                'address'       => '123 Main St, New York, NY 10001',
                'notes'         => 'Sensitive skin, allergic to certain fragrances',
                'last_visit'    => now()->subDays(7)->toDateString(),
                'total_visits'  => 8,
            ],
            [
                'uuid'          => 'pat-00000-0000-0000-000000000002',
                'name'          => 'Olivia Brown',
                'email'         => 'olivia.brown@email.com',
                'phone'         => '+1 (555) 234-5678',
                'date_of_birth' => '1988-07-22',
                'address'       => '456 Park Ave, New York, NY 10022',
                'notes'         => 'Regular Botox treatments every 4 months',
                'last_visit'    => now()->subDays(14)->toDateString(),
                'total_visits'  => 12,
            ],
            [
                'uuid'          => 'pat-00000-0000-0000-000000000003',
                'name'          => 'Sophia Davis',
                'email'         => 'sophia.davis@email.com',
                'phone'         => '+1 (555) 345-6789',
                'date_of_birth' => '1995-11-30',
                'address'       => '789 Broadway, New York, NY 10003',
                'notes'         => 'Interested in laser treatments for acne scarring',
                'last_visit'    => now()->subDays(21)->toDateString(),
                'total_visits'  => 5,
            ],
            [
                'uuid'          => 'pat-00000-0000-0000-000000000004',
                'name'          => 'Ava Martinez',
                'email'         => 'ava.martinez@email.com',
                'phone'         => '+1 (555) 456-7890',
                'date_of_birth' => '1993-05-18',
                'address'       => '321 Fifth Ave, New York, NY 10016',
                'notes'         => 'Prefers morning appointments',
                'last_visit'    => now()->subDays(3)->toDateString(),
                'total_visits'  => 3,
            ],
        ];

        foreach ($patients as $patient) {
            Patient::updateOrCreate(['uuid' => $patient['uuid']], $patient);
        }
    }
}
