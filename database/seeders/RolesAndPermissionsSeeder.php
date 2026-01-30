<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'view dashboard',
            'view leaderboard',
            'view achievements',
            'manage daily tasks',
            'redeem rewards',
            'enroll courses',
            'view courses',
            'view messages',
            'send messages',
            'manage courses',
            'manage course sessions',
            'manage users',
            'monitor all tutors',
            'monitor all students',
            'view all chats',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $tutor = Role::firstOrCreate(['name' => 'tutor']);
        $student = Role::firstOrCreate(['name' => 'student']);

        $student->syncPermissions([
            'view dashboard',
            'view leaderboard',
            'view achievements',
            'manage daily tasks',
            'redeem rewards',
            'enroll courses',
            'view courses',
            'view messages',
            'send messages',
        ]);

        $tutor->syncPermissions([
            'manage courses',
            'manage course sessions',
            'view courses',
            'view messages',
            'send messages',
        ]);

        $admin->syncPermissions(Permission::all());
    }
}
