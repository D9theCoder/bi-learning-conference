<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reward extends Model
{
    /** @use HasFactory<\Database\Factories\RewardFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'cost',
        'icon',
        'category',
        'rarity',
        'is_active',
        'stock',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'rarity' => 'string',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps()->withPivot('points_spent', 'claimed_at');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
