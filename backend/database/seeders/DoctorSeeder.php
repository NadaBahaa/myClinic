<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\PractitionerType;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $dermatologist   = PractitionerType::where('uuid', 'pt1-0000-0000-0000-000000000001')->first();
        $cosmeticSurgeon = PractitionerType::where('uuid', 'pt5-0000-0000-0000-000000000005')->first();

        $sarahUser   = User::where('uuid', 'user-0000-0000-0000-000000000002')->first();
        $michaelUser = User::where('uuid', 'user-0000-0000-0000-000000000003')->first();

        $doctors = [
            [
                'uuid'                 => 'doc-00000-0000-0000-000000000001',
                'user_id'              => $sarahUser?->id,
                'practitioner_type_id' => $dermatologist?->id,
                'name'                 => 'Dr. Sarah Johnson',
                'email'                => 'sarah@clinic.com',
                'phone'                => '+1 (555) 234-5678',
                'specialty'            => 'Dermatology',
                'experience'           => 12,
                'qualifications'       => 'MD, Board Certified Dermatologist',
                'license_number'       => 'MD123456',
                'availability'         => json_encode(['Monday', 'Tuesday', 'Wednesday', 'Friday']),
                'total_patients'       => 156,
            ],
            [
                'uuid'                 => 'doc-00000-0000-0000-000000000002',
                'user_id'              => $michaelUser?->id,
                'practitioner_type_id' => $cosmeticSurgeon?->id,
                'name'                 => 'Dr. Michael Chen',
                'email'                => 'michael@clinic.com',
                'phone'                => '+1 (555) 345-6789',
                'specialty'            => 'Cosmetic Surgery',
                'experience'           => 15,
                'qualifications'       => 'MD, FACS, Board Certified Plastic Surgeon',
                'license_number'       => 'MD789012',
                'availability'         => json_encode(['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),
                'total_patients'       => 98,
            ],
        ];

        foreach ($doctors as $doctor) {
            Doctor::updateOrCreate(['uuid' => $doctor['uuid']], $doctor);
        }
    }
}
