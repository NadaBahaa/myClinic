<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PractitionerTypeSeeder::class,
            UserSeeder::class,
            DoctorSeeder::class,
            PatientSeeder::class,
            ServiceSeeder::class,
            MaterialOrToolSeeder::class,
            AppointmentSeeder::class,
        ]);
    }
}
