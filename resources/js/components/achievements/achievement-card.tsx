import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Achievement } from '@/types';
import { Award, Medal, Star, Trophy } from 'lucide-react';

const rarityColors = {
  bronze: 'bg-orange-700/20 text-orange-400 border-orange-700',
  silver: 'bg-gray-400/20 text-gray-200 border-gray-400',
  gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
  platinum: 'bg-purple-500/20 text-purple-400 border-purple-500',
};

const rarityIcons = {
  bronze: Medal,
  silver: Award,
  gold: Star,
  platinum: Trophy,
};

interface AchievementCardProps {
  achievement: Achievement & {
    earned?: boolean;
    earned_at?: string;
    progress?: number;
    target?: number;
  };
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = rarityIcons[achievement.rarity];
  const progressPercent =
    achievement.progress && achievement.target
      ? Math.min((achievement.progress / achievement.target) * 100, 100)
      : 0;

  return (
    <Card
      className={`transition-colors ${
        achievement.earned
          ? 'border-green-500/50 bg-green-500/5 dark:border-green-400/30'
          : 'opacity-90 grayscale-[0.2]'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${
                achievement.earned ? 'bg-secondary' : 'bg-muted'
              }`}
            >
              <Icon
                className={`size-5 ${
                  achievement.earned ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-base leading-none font-bold">
                {achievement.name}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {achievement.description}
              </p>
            </div>
          </div>
          <Badge className={rarityColors[achievement.rarity]} variant="outline">
            {achievement.rarity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {achievement.earned ? (
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-green-600 dark:text-green-400">
                Completed
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(achievement.earned_at!).toLocaleDateString()}
              </span>
            </div>
          ) : achievement.target ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {achievement.progress ?? 0}/{achievement.target}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          ) : null}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="size-3" />
            <span>{achievement.xp_reward} XP Reward</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
