interface DifficultyBadgeProps {
  difficulty: string;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const color =
    {
      beginner:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      intermediate:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }[difficulty.toLowerCase()] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${color}`}
    >
      {difficulty}
    </span>
  );
}
