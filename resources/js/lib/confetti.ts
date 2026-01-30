import confetti from 'canvas-confetti';

/**
 * Fires a basic confetti animation
 * @param options - Confetti configuration options
 */
export function fireConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  };

  confetti({
    ...defaults,
    ...options,
  });
}

/**
 * Fires a rarity-specific confetti animation
 * @param rarity - The rarity tier of the reward
 */
export function fireRewardConfetti(
  rarity?: 'common' | 'rare' | 'epic' | 'legendary',
) {
  const rarityColors = {
    common: ['#9CA3AF', '#D1D5DB', '#E5E7EB'], // gray/silver tones
    rare: ['#3B82F6', '#60A5FA', '#93C5FD'], // blue tones
    epic: ['#A855F7', '#C084FC', '#E9D5FF'], // purple tones
    legendary: ['#EAB308', '#FACC15', '#FDE047'], // gold/yellow tones
  };

  const colors = rarity ? rarityColors[rarity] : rarityColors.common;

  // Fire multiple bursts for a more dramatic effect
  const count = 200;
  const defaults = {
    origin: { y: 0.5 },
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors,
    });
  }

  // Multiple explosions with different spreads and angles
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
