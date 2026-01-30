import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak?: number;
  className?: string;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  className,
}: StreakIndicatorProps) {
  const isActive = currentStreak > 0;

  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={cn(
            'flex size-16 items-center justify-center rounded-full transition-all',
            isActive
              ? 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Flame className={cn('size-8', isActive && 'animate-pulse')} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{currentStreak}</p>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          {longestStreak !== undefined && longestStreak > currentStreak && (
            <Badge variant="outline" className="mt-2">
              Best: {longestStreak} days
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
