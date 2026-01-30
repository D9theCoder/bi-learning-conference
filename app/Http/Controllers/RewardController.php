<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RewardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $rarityFilter = $request->query('rarity');

        // Load rewards with optional rarity filter
        $query = Reward::where('is_active', true);

        if ($rarityFilter) {
            $query->where('rarity', $rarityFilter);
        }

        $rewards = $query->orderBy('cost')
            ->paginate(12)
            ->withQueryString();

        // Add can_redeem flag to each reward
        $rewards->through(function ($reward) use ($user) {
            $data = $reward->toArray();
            $data['can_redeem'] = ($user->points_balance >= $reward->cost) &&
                                  ($reward->stock === null || $reward->stock > 0);
            $data['remaining_stock'] = $reward->stock;

            return $data;
        });

        return Inertia::render('rewards/index', [
            'user' => [
                'points_balance' => $user->points_balance ?? 0,
            ],
            'rewards' => $rewards,
            'filters' => [
                'rarity' => $rarityFilter,
            ],
        ]);
    }
}
