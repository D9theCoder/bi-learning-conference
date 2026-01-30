import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, Zap } from 'lucide-react';

interface LevelProgressBarProps {
  currentLevel: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp?: number;
  className?: string;
}

export function LevelProgressBar({
  currentLevel,
  currentXp,
  xpForNextLevel,
  totalXp,
  className,
}: LevelProgressBarProps) {
  // Prevent division by zero
  const progress = xpForNextLevel > 0 ? (currentXp / xpForNextLevel) * 100 : 0;
  const xpRemaining = xpForNextLevel > 0 ? xpForNextLevel - currentXp : 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 shadow-sm',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-50" />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md ring-2 ring-primary/20">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Current Level
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight text-primary">
                  {currentLevel}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Lvl
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Zap className="size-3 fill-primary" />
              XP Progress
            </div>
            <p className="mt-1 text-lg font-bold">
              {currentXp.toLocaleString()}{' '}
              <span className="text-sm font-medium text-muted-foreground">
                / {xpForNextLevel.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
            {/* Glow effect */}
            <div
              className="absolute top-0 right-0 bottom-0 w-4 translate-x-full bg-white/30 blur-sm"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              {xpRemaining.toLocaleString()} XP to Level {currentLevel + 1}
            </span>
            {totalXp !== undefined && (
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                Total: {totalXp.toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
