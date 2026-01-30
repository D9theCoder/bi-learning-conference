<?php

namespace App\Http\Controllers;

use App\Http\Requests\RedeemRewardRequest;
use App\Models\Activity;
use App\Models\Reward;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class RewardRedemptionController extends Controller
{
    public function store(RedeemRewardRequest $request, Reward $reward): RedirectResponse
    {
        $user = $request->user();

        // Atomic transaction for redemption
        DB::transaction(function () use ($user, $reward) {
            // Check availability
            if ($reward->stock !== null && $reward->stock <= 0) {
                abort(422, 'Reward is out of stock');
            }

            // Check points
            if ($user->points_balance < $reward->cost) {
                abort(422, 'Insufficient points');
            }

            // Deduct points
            $user->decrement('points_balance', $reward->cost);

            // Decrement stock if applicable
            if ($reward->stock !== null) {
                $reward->decrement('stock');
            }

            // Record redemption in pivot table
            $user->rewards()->attach($reward->id, [
                'points_spent' => $reward->cost,
                'claimed_at' => now(),
            ]);

            // Log activity
            Activity::create([
                'user_id' => $user->id,
                'type' => 'reward_claimed',
                'description' => "Redeemed: {$reward->name}",
                'xp_earned' => 0,
            ]);
        });

        return back()->with('message', 'Reward redeemed successfully!');
    }
}
