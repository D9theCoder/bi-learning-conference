import { Button } from '@/components/ui/button';
import type { Powerup, PowerupUsage } from '@/types';
import { Clock, ListMinus, Sparkles } from 'lucide-react';

interface QuizQuestionSummary {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
}

interface QuizPowerupBarProps {
  powerups: Powerup[];
  usedPowerups: PowerupUsage[];
  currentQuestion: QuizQuestionSummary;
  remainingTime: number | null;
  isUsing: boolean;
  error?: string | null;
  onUsePowerup: (powerup: Powerup, questionId?: number) => void;
  onClearError: () => void;
}

const powerupIcons: Record<string, typeof Sparkles> = {
  '50-50': ListMinus,
  'extra-time': Clock,
};

export function QuizPowerupBar({
  powerups,
  usedPowerups,
  currentQuestion,
  remainingTime,
  isUsing,
  error,
  onUsePowerup,
  onClearError,
}: QuizPowerupBarProps) {
  const usedCountById = usedPowerups.reduce<Record<number, number>>(
    (counts, usage) => {
      counts[usage.id] = (counts[usage.id] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const usedFiftyOnQuestion = usedPowerups.some((usage) => {
    if (usage.slug !== '50-50') {
      return false;
    }

    const questionId = (usage.details as { question_id?: number | string })
      ?.question_id;
    return questionId !== undefined && String(questionId) === `${currentQuestion.id}`;
  });

  return (
    <div className="mx-auto mb-4 max-w-3xl rounded-xl border bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-gray-950/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Powerups</p>
          <p className="text-xs text-muted-foreground">
            Use sparingly to get an edge.
          </p>
        </div>
        {error ? (
          <button
            type="button"
            onClick={onClearError}
            className="text-xs text-destructive"
          >
            Dismiss
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {powerups.map((powerup) => {
          const Icon = powerupIcons[powerup.slug] ?? Sparkles;
          const limit = powerup.limit ?? powerup.default_limit ?? 1;
          const usedCount = usedCountById[powerup.id] ?? 0;
          const remaining = Math.max(limit - usedCount, 0);

          const isFifty = powerup.slug === '50-50';
          const isExtraTime = powerup.slug === 'extra-time';
          const isQuestionEligible =
            !isFifty ||
            (currentQuestion.type === 'multiple_choice' &&
              !usedFiftyOnQuestion);
          const hasTimer = !isExtraTime || remainingTime !== null;

          const isDisabled =
            remaining === 0 || !isQuestionEligible || !hasTimer || isUsing;

          let reason = '';

          if (remaining === 0) {
            reason = 'No uses left.';
          } else if (!isQuestionEligible) {
            reason = 'Only for multiple choice questions.';
          } else if (!hasTimer) {
            reason = 'No active timer for this quiz.';
          } else if (isUsing) {
            reason = 'Applying powerup...';
          }

          return (
            <div
              key={powerup.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{powerup.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {remaining} / {limit} left
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={isDisabled}
                title={reason || 'Use powerup'}
                onClick={() =>
                  onUsePowerup(
                    powerup,
                    isFifty ? currentQuestion.id : undefined,
                  )
                }
              >
                Use
              </Button>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
