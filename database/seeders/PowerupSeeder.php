<?php

namespace Database\Seeders;

use App\Models\Powerup;
use Illuminate\Database\Seeder;

class PowerupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $powerups = [
            [
                'name' => '50/50',
                'slug' => '50-50',
                'description' => 'Remove two incorrect options on a multiple choice question.',
                'icon' => 'list-minus',
                'default_limit' => 1,
                'config' => [
                    'remove_count' => 2,
                ],
            ],
            [
                'name' => 'Extra Time',
                'slug' => 'extra-time',
                'description' => 'Add 2 extra minutes to your quiz timer.',
                'icon' => 'clock',
                'default_limit' => 2,
                'config' => [
                    'extra_time_seconds' => 120,
                ],
            ],
        ];

        foreach ($powerups as $powerup) {
            Powerup::updateOrCreate(
                ['slug' => $powerup['slug']],
                $powerup
            );
        }
    }
}
