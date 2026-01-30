<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->upsertUser([
            'name' => 'Fixed Superadmin',
            'email' => 'superadmin@gmail.com',
            'password' => 'password',
            'email_verified_at' => now(),
        ], 'admin');

        $this->upsertUser([
            'name' => 'Fixed Tutor',
            'email' => 'tutor@gmail.com',
            'password' => 'password',
            'email_verified_at' => now(),
        ], 'tutor');

        $this->upsertUser([
            'name' => 'Fixed Student',
            'email' => 'student@gmail.com',
            'password' => 'password',
            'email_verified_at' => now(),
            'points_balance' => 100000,
        ], 'student');

        $this->upsertUser([
            'name' => 'Focused Student',
            'email' => 'student1@gmail.com',
            'password' => 'password',
            'email_verified_at' => now(),
            'points_balance' => 50000,
        ], 'student');
    }

    private function upsertUser(array $attributes, string $role): User
    {
        $user = User::updateOrCreate(['email' => $attributes['email']], $attributes);
        $user->syncRoles($role);

        return $user;
    }
}
