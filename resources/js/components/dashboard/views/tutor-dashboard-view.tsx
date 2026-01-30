import { DashboardErrorBoundary } from '@/components/dashboard/dashboard-error-boundary';
import {
  DashboardWelcomeHeader,
  TutorActivityChartSection,
  TutorCalendarSection,
  TutorCourseListSection,
  TutorStatsSection,
} from '@/components/dashboard/sections';
import { ActivityChartSkeleton } from '@/components/dashboard/skeletons/activity-chart-skeleton';
import { CoursesSkeleton } from '@/components/dashboard/skeletons/courses-skeleton';
import { SidebarSkeleton } from '@/components/dashboard/skeletons/sidebar-skeleton';
import { StatsSkeleton } from '@/components/dashboard/skeletons/stats-skeleton';
import { TutorChatWidget } from '@/components/dashboard/tutor-chat-widget';
import type { TutorDashboardData, TutorMessage } from '@/types';

interface TutorDashboardViewProps {
  userName: string;
  pointsBalance: number;
  isLoading: boolean;
  tutorData: TutorDashboardData | null;
  tutorMessages: TutorMessage[];
  unreadMessageCount: number;
  attendanceAverage: number;
  assignmentAverage: number;
}

export function TutorDashboardView({
  userName,
  pointsBalance,
  isLoading,
  tutorData,
  tutorMessages,
  unreadMessageCount,
  attendanceAverage,
  assignmentAverage,
}: TutorDashboardViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-4 lg:p-8">
      <DashboardWelcomeHeader
        userName={userName}
        pointsBalance={pointsBalance}
        isTutor
      />

      <DashboardErrorBoundary>
        {isLoading ? (
          <StatsSkeleton />
        ) : tutorData ? (
          <TutorStatsSection
            summary={tutorData.summary}
            attendanceAverage={attendanceAverage}
            assignmentAverage={assignmentAverage}
          />
        ) : null}
      </DashboardErrorBoundary>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Course Activity Chart */}
          {isLoading ? (
            <ActivityChartSkeleton />
          ) : tutorData ? (
            <DashboardErrorBoundary>
              <TutorActivityChartSection data={tutorData.chart} />
            </DashboardErrorBoundary>
          ) : null}

          {/* Courses you teach */}
          {isLoading ? (
            <CoursesSkeleton />
          ) : tutorData ? (
            <DashboardErrorBoundary>
              <TutorCourseListSection courses={tutorData.courses} />
            </DashboardErrorBoundary>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          {isLoading ? (
            <SidebarSkeleton />
          ) : (
            <>
              {/* Upcoming deadlines */}
              {tutorData && (
                <DashboardErrorBoundary>
                  <TutorCalendarSection items={tutorData.calendar} />
                </DashboardErrorBoundary>
              )}

              {/* Chat widget */}
              {tutorMessages.length > 0 && (
                <DashboardErrorBoundary>
                  <TutorChatWidget
                    messages={tutorMessages}
                    unreadCount={unreadMessageCount}
                  />
                </DashboardErrorBoundary>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
