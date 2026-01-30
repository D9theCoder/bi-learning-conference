import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';
import { Award, BookOpen, LucideIcon, Trophy } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: Activity[];
  className?: string;
}

const activityIcons: Record<string, LucideIcon> = {
  lesson_completed: BookOpen,
  task_completed: BookOpen,
  achievement_earned: Award,
  course_enrolled: BookOpen,
  reward_claimed: Trophy,
  level_up: Trophy,
};

const activityColors: Record<string, string> = {
  lesson_completed: 'text-blue-500 bg-blue-500/10',
  task_completed: 'text-amber-500 bg-amber-500/10',
  achievement_earned: 'text-yellow-500 bg-yellow-500/10',
  course_enrolled: 'text-green-500 bg-green-500/10',
  reward_claimed: 'text-purple-500 bg-purple-500/10',
  level_up: 'text-orange-500 bg-orange-500/10',
};

const activityTitles: Record<string, string> = {
  lesson_completed: 'Completed Lesson',
  task_completed: 'Completed Task',
  achievement_earned: 'Achievement Earned',
  course_enrolled: 'Course Enrolled',
  reward_claimed: 'Reward Claimed',
  level_up: 'Level Up!',
};

export function RecentActivityFeed({
  activities,
  className,
}: RecentActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col gap-4">
            {activities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || BookOpen;
                const colorClass =
                  activityColors[activity.type] ||
                  'text-muted-foreground bg-muted';
                const title = activityTitles[activity.type] || 'Activity';

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        colorClass,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight font-medium">
                        {title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <time className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </time>
                        {activity.xp_earned > 0 && (
                          <Badge variant="outline" className="h-5">
                            +{activity.xp_earned} XP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
