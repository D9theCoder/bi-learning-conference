import {
  AdminDashboardView,
  StudentDashboardView,
  TutorDashboardView,
} from '@/components/dashboard/views';
import { useRoles } from '@/hooks/use-roles';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type {
  Achievement,
  Activity,
  AdminDashboardData,
  BreadcrumbItem,
  DailyTask,
  Enrollment,
  LeaderboardEntry,
  LearningStats,
  Reward,
  StudentCalendarItem,
  TutorDashboardData,
  TutorMessage,
  User,
} from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
];

interface DashboardPageProps {
  stats: LearningStats;
  today_tasks: DailyTask[];
  enrolled_courses: Enrollment[];
  student_calendar: StudentCalendarItem[];
  recent_achievements: Achievement[];
  next_milestone: Achievement | null;
  recent_activity: Activity[];
  tutor_messages: TutorMessage[];
  unread_message_count: number;
  global_leaderboard: LeaderboardEntry[];
  weekly_activity_data: { name: string; value: number }[];
  available_rewards?: Reward[];
  current_user_rank?: number | null;
  tutor_dashboard?: TutorDashboardData | null;
  admin_dashboard?: AdminDashboardData | null;
}

export default function Dashboard({
  stats,
  today_tasks,
  enrolled_courses,
  student_calendar,
  recent_achievements,
  next_milestone,
  recent_activity,
  tutor_messages,
  unread_message_count,
  global_leaderboard,
  weekly_activity_data,
  tutor_dashboard,
  admin_dashboard,
}: DashboardPageProps) {
  const { isAdmin, isTutor } = useRoles();
  const page = usePage<{ auth?: { user?: User } }>();
  const userName = page.props.auth?.user?.name ?? 'there';

  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  const safeStats: LearningStats = {
    streak: stats?.streak ?? 0,
    xp_this_week: stats?.xp_this_week ?? 0,
    hours_learned: stats?.hours_learned ?? 0,
    active_courses: stats?.active_courses ?? 0,
    total_xp: stats?.total_xp ?? 0,
    level: stats?.level ?? 1,
    points_balance: stats?.points_balance ?? 0,
    xp_in_level: stats?.xp_in_level ?? 0,
    xp_for_next_level: stats?.xp_for_next_level ?? 75,
    level_progress_percentage: stats?.level_progress_percentage ?? 0,
  };

  const todayTasks = today_tasks ?? [];
  const enrolledCourses = enrolled_courses ?? [];
  const studentCalendar = student_calendar ?? [];
  const recentAchievements = recent_achievements ?? [];
  const globalLeaderboard = global_leaderboard ?? [];
  const tutorMessages = tutor_messages ?? [];
  const recentActivity = recent_activity ?? [];
  const weeklyActivityData = weekly_activity_data ?? [];
  const nextMilestone = next_milestone ?? null;
  const unreadMessageCount =
    unread_message_count ??
    tutorMessages.filter((message) => message.is_read === false).length;

  const tutorData = tutor_dashboard ?? null;
  const tutorChart = tutorData?.chart ?? [];
  const attendanceAverage =
    tutorChart.length > 0
      ? Math.round(
          tutorChart.reduce((sum, entry) => sum + entry.attendance, 0) /
            tutorChart.length,
        )
      : 0;
  const assignmentAverage =
    tutorChart.length > 0
      ? Math.round(
          tutorChart.reduce((sum, entry) => sum + entry.quiz, 0) /
            tutorChart.length,
        )
      : 0;

  if (isAdmin && admin_dashboard) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Admin Dashboard" />
        <AdminDashboardView
          userName={userName}
          adminData={admin_dashboard}
          isLoading={isLoading}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      {isTutor ? (
        <TutorDashboardView
          userName={userName}
          pointsBalance={safeStats.points_balance}
          isLoading={isLoading}
          tutorData={tutorData}
          tutorMessages={tutorMessages}
          unreadMessageCount={unreadMessageCount}
          attendanceAverage={attendanceAverage}
          assignmentAverage={assignmentAverage}
        />
      ) : (
        <StudentDashboardView
          userName={userName}
          stats={safeStats}
          isLoading={isLoading}
          todayTasks={todayTasks}
          enrolledCourses={enrolledCourses}
          studentCalendar={studentCalendar}
          weeklyActivityData={weeklyActivityData}
          recentAchievements={recentAchievements}
          nextMilestone={nextMilestone}
          globalLeaderboard={globalLeaderboard}
          tutorMessages={tutorMessages}
          unreadMessageCount={unreadMessageCount}
          recentActivity={recentActivity}
        />
      )}
    </AppLayout>
  );
}
