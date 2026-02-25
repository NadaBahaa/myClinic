<?php

namespace Database\Seeders;

use App\Models\PractitionerType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $dermatologist  = PractitionerType::where('uuid', 'pt1-0000-0000-0000-000000000001')->first();
        $cosmeticSurgeon = PractitionerType::where('uuid', 'pt5-0000-0000-0000-000000000005')->first();

        $users = [
            [
                'uuid'                 => 'user-0000-0000-0000-000000000001',
                'name'                 => 'Admin User',
                'email'                => 'admin@clinic.com',
                'password'             => Hash::make('admin123'),
                'role'                 => 'admin',
                'practitioner_type_id' => null,
                'perm_show_calendar'   => true,
                'perm_show_patients'   => true,
                'perm_show_doctors'    => true,
                'perm_show_services'   => true,
                'perm_show_users'      => true,
                'perm_show_settings'   => true,
            ],
            [
                'uuid'                 => 'user-0000-0000-0000-000000000002',
                'name'                 => 'Dr. Sarah Johnson',
                'email'                => 'sarah@clinic.com',
                'password'             => Hash::make('doctor123'),
                'role'                 => 'doctor',
                'practitioner_type_id' => $dermatologist?->id,
                'perm_show_calendar'   => true,
                'perm_show_patients'   => true,
                'perm_show_doctors'    => false,
                'perm_show_services'   => true,
                'perm_show_users'      => false,
                'perm_show_settings'   => false,
            ],
            [
                'uuid'                 => 'user-0000-0000-0000-000000000003',
                'name'                 => 'Dr. Michael Chen',
                'email'                => 'michael@clinic.com',
                'password'             => Hash::make('doctor123'),
                'role'                 => 'doctor',
                'practitioner_type_id' => $cosmeticSurgeon?->id,
                'perm_show_calendar'   => true,
                'perm_show_patients'   => true,
                'perm_show_doctors'    => false,
                'perm_show_services'   => true,
                'perm_show_users'      => false,
                'perm_show_settings'   => false,
            ],
            [
                'uuid'                 => 'user-0000-0000-0000-000000000004',
                'name'                 => 'Jessica Smith',
                'email'                => 'assistant@clinic.com',
                'password'             => Hash::make('assistant123'),
                'role'                 => 'assistant',
                'practitioner_type_id' => null,
                'perm_show_calendar'   => true,
                'perm_show_patients'   => true,
                'perm_show_doctors'    => true,
                'perm_show_services'   => false,
                'perm_show_users'      => false,
                'perm_show_settings'   => false,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['uuid' => $user['uuid']], $user);
        }
    }
}
