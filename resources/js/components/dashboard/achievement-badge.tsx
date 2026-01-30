import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types';
import { Award, Lock } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean; // Optional, defaults to !!earned_at
  unlockedAt?: string;
  className?: string;
  variant?: 'list' | 'tile';
}

export function AchievementBadge({
  achievement,
  unlocked = !!achievement.earned_at,
  unlockedAt = achievement.earned_at,
  className,
  variant = 'list',
}: AchievementBadgeProps) {
  const progressPercent =
    achievement.progress && achievement.target
      ? Math.min((achievement.progress / achievement.target) * 100, 100)
      : 0;

  if (variant === 'tile') {
    return (
      <Card
        className={cn(
          'flex aspect-square flex-col items-center justify-center p-3 text-center transition-all hover:scale-105 hover:shadow-md',
          !unlocked && 'bg-muted/50 opacity-60 grayscale',
          className,
        )}
      >
        <div
          className={cn(
            'mb-2 flex size-12 items-center justify-center rounded-full',
            unlocked
              ? 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {unlocked ? (
            <Award className="size-6" />
          ) : (
            <Lock className="size-6" />
          )}
        </div>
        <h4 className="line-clamp-2 text-xs leading-tight font-semibold">
          {achievement.name}
        </h4>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        !unlocked && !achievement.progress && 'opacity-50 grayscale', // Only gray out if completely locked/no progress
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-full',
            unlocked
              ? 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {unlocked ? (
            <Award className="size-7" />
          ) : (
            <Lock className="size-7" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="leading-none font-semibold">{achievement.name}</h4>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>

          {unlocked && unlockedAt && (
            <Badge variant="outline" className="mt-2 text-[10px] font-normal">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </Badge>
          )}

          {!unlocked && achievement.target ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span>
                  {achievement.progress ?? 0} / {achievement.target}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          ) : null}

          {!unlocked && !achievement.target && achievement.xp_reward && (
            <Badge variant="secondary" className="mt-2 text-[10px] font-normal">
              +{achievement.xp_reward} XP
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
