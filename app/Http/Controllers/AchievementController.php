<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Load all achievements
        $allAchievements = Achievement::all();

        // Get user's achievement progress with pivot data
        $userProgress = DB::table('achievement_user')
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('achievement_id');

        // Compute earned flags and progress for each achievement
        $achievements = $allAchievements->map(function ($achievement) use ($userProgress) {
            $pivot = $userProgress->get($achievement->id);
            $earned = $pivot && $pivot->earned_at !== null;

            return [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'rarity' => $achievement->rarity,
                'xp_reward' => $achievement->xp_reward,
                'category' => $achievement->category,
                'target' => $achievement->target,
                'progress' => $pivot ? $pivot->progress : 0,
                'earned' => $earned,
                'earned_at' => $earned ? $pivot->earned_at : null,
            ];
        });

        // Get next milestone (first unearned achievement with most progress)
        $nextMilestone = $allAchievements
            ->filter(function ($achievement) use ($userProgress) {
                $pivot = $userProgress->get($achievement->id);

                return ! $pivot || $pivot->earned_at === null;
            })
            ->sortByDesc(function ($achievement) use ($userProgress) {
                $pivot = $userProgress->get($achievement->id);

                return $pivot ? ($pivot->progress / max(1, $achievement->target)) : 0;
            })
            ->first();

        // Count earned achievements
        $earnedCount = $userProgress->filter(fn ($p) => $p->earned_at !== null)->count();

        return Inertia::render('achievements/index', [
            'achievements' => $achievements,
            'summary' => [
                'total' => $allAchievements->count(),
                'earned' => $earnedCount,
                'nextMilestone' => $nextMilestone ? [
                    'id' => $nextMilestone->id,
                    'name' => $nextMilestone->name,
                    'progress' => $userProgress->get($nextMilestone->id)?->progress ?? 0,
                    'target' => $nextMilestone->target,
                ] : null,
            ],
        ]);
    }
}
