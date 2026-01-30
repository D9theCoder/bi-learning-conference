import { AchievementBadge } from '@/components/dashboard/achievement-badge';
import { DashboardErrorBoundary } from '@/components/dashboard/dashboard-error-boundary';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { LevelProgressBar } from '@/components/dashboard/level-progress-bar';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { TutorChatWidget } from '@/components/dashboard/tutor-chat-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  Achievement,
  Activity,
  LeaderboardEntry,
  LearningStats,
  TutorMessage,
} from '@/types';
import { memo } from 'react';

interface DashboardSidebarProps {
  stats: LearningStats;
  recentAchievements: Achievement[];
  nextMilestone: Achievement | null;
  globalLeaderboard: LeaderboardEntry[];
  tutorMessages: TutorMessage[];
  unreadMessageCount: number;
  recentActivity: Activity[];
}

export const DashboardSidebar = memo(
  ({
    stats,
    recentAchievements,
    nextMilestone,
    globalLeaderboard,
    tutorMessages,
    unreadMessageCount,
    recentActivity,
  }: DashboardSidebarProps) => (
    <div
      className="flex flex-col gap-6"
      role="complementary"
      aria-label="Dashboard sidebar"
    >
      {/* Level Progress - Sticky */}
      <div className="sticky top-4 z-10">
        <DashboardErrorBoundary>
          <LevelProgressBar
            currentLevel={stats.level}
            currentXp={stats.xp_in_level ?? stats.total_xp}
            xpForNextLevel={stats.xp_for_next_level ?? 75}
            totalXp={stats.total_xp}
          />
        </DashboardErrorBoundary>
      </div>

      {/* Achievements - Trophy Case */}
      <DashboardErrorBoundary>
        <section aria-labelledby="achievements-heading">
          <Card className="gap-4 pt-6 pb-4">
            <CardHeader className="pb-0">
              <CardTitle id="achievements-heading">Trophy Case</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAchievements.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    <TooltipProvider>
                      {/* Achievement Items */}
                      {recentAchievements.map((achievement) => {
                        const hasProgress =
                          !achievement.earned_at &&
                          achievement.progress !== undefined &&
                          achievement.target !== undefined;
                        const progressPercent = hasProgress
                          ? Math.min(
                              100,
                              ((achievement.progress ?? 0) /
                                (achievement.target ?? 1)) *
                                100,
                            )
                          : 0;

                        return (
                          <Tooltip key={achievement.id}>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col gap-2">
                                <AchievementBadge
                                  achievement={achievement}
                                  unlocked={!!achievement.earned_at}
                                  unlockedAt={achievement.earned_at}
                                  variant="tile"
                                  className={
                                    hasProgress ? 'border-primary/50' : ''
                                  }
                                />
                                {hasProgress ? (
                                  <Progress
                                    value={progressPercent}
                                    className="h-1 w-full"
                                  />
                                ) : (
                                  <div className="h-1 w-full" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">
                                {achievement.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {achievement.description}
                              </p>
                              {hasProgress && (
                                <p className="mt-1 text-[10px] text-primary">
                                  Progress: {achievement.progress}/
                                  {achievement.target}
                                </p>
                              )}
                              {achievement.earned_at && (
                                <p className="mt-1 text-[10px] text-green-500">
                                  Unlocked:{' '}
                                  {new Date(
                                    achievement.earned_at,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      {/* Next Milestone Item */}
                      {nextMilestone &&
                        !recentAchievements.some(
                          (a) => a.id === nextMilestone.id,
                        ) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col gap-2">
                                <AchievementBadge
                                  achievement={nextMilestone}
                                  unlocked={false}
                                  variant="tile"
                                  className="border-dashed"
                                />
                                {nextMilestone.progress !== undefined &&
                                nextMilestone.target !== undefined ? (
                                  <Progress
                                    value={Math.min(
                                      100,
                                      ((nextMilestone.progress ?? 0) /
                                        (nextMilestone.target ?? 1)) *
                                        100,
                                    )}
                                    className="h-1 w-full"
                                  />
                                ) : (
                                  <div className="h-1 w-full" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">
                                Next Goal: {nextMilestone.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {nextMilestone.description}
                              </p>
                              {nextMilestone.progress !== undefined &&
                                nextMilestone.target !== undefined && (
                                  <p className="mt-1 text-[10px] text-primary">
                                    Progress: {nextMilestone.progress}/
                                    {nextMilestone.target}
                                  </p>
                                )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </TooltipProvider>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Start learning to earn badges!
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </DashboardErrorBoundary>

      {/* Global Leaderboard */}
      {globalLeaderboard.length > 0 && (
        <DashboardErrorBoundary>
          <Leaderboard entries={globalLeaderboard} />
        </DashboardErrorBoundary>
      )}

      {/* Tutor Messages */}
      {tutorMessages.length > 0 && (
        <DashboardErrorBoundary>
          <TutorChatWidget
            messages={tutorMessages}
            unreadCount={unreadMessageCount}
          />
        </DashboardErrorBoundary>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <DashboardErrorBoundary>
          <RecentActivityFeed activities={recentActivity} />
        </DashboardErrorBoundary>
      )}
    </div>
  ),
);

DashboardSidebar.displayName = 'DashboardSidebar';
