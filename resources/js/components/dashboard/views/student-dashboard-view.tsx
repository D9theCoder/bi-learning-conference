import { DashboardErrorBoundary } from '@/components/dashboard/dashboard-error-boundary';
import {
  DashboardActivityChartSection,
  DashboardCoursesSection,
  DashboardStatsSection,
  DashboardWelcomeHeader,
  StudentCalendarSection,
} from '@/components/dashboard/sections';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { ActivityChartSkeleton } from '@/components/dashboard/skeletons/activity-chart-skeleton';
import { CoursesSkeleton } from '@/components/dashboard/skeletons/courses-skeleton';
import { SidebarSkeleton } from '@/components/dashboard/skeletons/sidebar-skeleton';
import { StatsSkeleton } from '@/components/dashboard/skeletons/stats-skeleton';
import { TodayTasksSkeleton } from '@/components/dashboard/skeletons/today-tasks-skeleton';
import { TodayTaskList } from '@/components/dashboard/today-task-list';
import type {
  Achievement,
  Activity,
  DailyTask,
  Enrollment,
  LeaderboardEntry,
  LearningStats,
  StudentCalendarItem,
  TutorMessage,
} from '@/types';

interface StudentDashboardViewProps {
  userName: string;
  stats: LearningStats;
  isLoading: boolean;
  todayTasks: DailyTask[];
  enrolledCourses: Enrollment[];
  studentCalendar: StudentCalendarItem[];
  weeklyActivityData: { name: string; value: number }[];
  recentAchievements: Achievement[];
  nextMilestone: Achievement | null;
  globalLeaderboard: LeaderboardEntry[];
  tutorMessages: TutorMessage[];
  unreadMessageCount: number;
  recentActivity: Activity[];
}

export function StudentDashboardView({
  userName,
  stats,
  isLoading,
  todayTasks,
  enrolledCourses,
  studentCalendar,
  weeklyActivityData,
  recentAchievements,
  nextMilestone,
  globalLeaderboard,
  tutorMessages,
  unreadMessageCount,
  recentActivity,
}: StudentDashboardViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-4 lg:p-8">
      <DashboardWelcomeHeader
        userName={userName}
        pointsBalance={stats.points_balance}
      />

      <DashboardErrorBoundary>
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <DashboardStatsSection stats={stats} />
        )}
      </DashboardErrorBoundary>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Today's Tasks */}
          <DashboardErrorBoundary>
            {isLoading ? (
              <TodayTasksSkeleton />
            ) : (
              <TodayTaskList tasks={todayTasks} />
            )}
          </DashboardErrorBoundary>

          {/* Upcoming Schedule (Meetings & Assessments) */}
          {!isLoading && studentCalendar.length > 0 && (
            <DashboardErrorBoundary>
              <StudentCalendarSection items={studentCalendar} />
            </DashboardErrorBoundary>
          )}

          {/* My Courses */}
          <DashboardErrorBoundary>
            {isLoading ? (
              <CoursesSkeleton />
            ) : (
              <DashboardCoursesSection enrolledCourses={enrolledCourses} />
            )}
          </DashboardErrorBoundary>

          {/* Weekly Activity */}
          {isLoading ? (
            <ActivityChartSkeleton />
          ) : (
            weeklyActivityData.length > 0 && (
              <DashboardErrorBoundary>
                <DashboardActivityChartSection
                  weeklyActivityData={weeklyActivityData}
                />
              </DashboardErrorBoundary>
            )
          )}
        </div>

        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <DashboardSidebar
            stats={stats}
            recentAchievements={recentAchievements}
            nextMilestone={nextMilestone}
            globalLeaderboard={globalLeaderboard}
            tutorMessages={tutorMessages}
            unreadMessageCount={unreadMessageCount}
            recentActivity={recentActivity}
          />
        )}
      </div>
    </div>
  );
}
