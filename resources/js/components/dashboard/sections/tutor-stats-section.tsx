import { StatCard } from '@/components/dashboard/stat-card';
import type { TutorDashboardData } from '@/types';
import {
  Activity as ActivityIcon,
  BarChart3,
  GraduationCap,
  Users,
} from 'lucide-react';
import { memo } from 'react';

interface TutorStatsSectionProps {
  summary: TutorDashboardData['summary'];
  attendanceAverage: number;
  assignmentAverage: number;
}

export const TutorStatsSection = memo(
  ({
    summary,
    attendanceAverage,
    assignmentAverage,
  }: TutorStatsSectionProps) => (
    <section
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      aria-label="Tutor statistics"
    >
      <StatCard
        icon={GraduationCap}
        label="Courses Taught"
        value={summary.course_count}
        color="blue"
        disableHover
      />
      <StatCard
        icon={Users}
        label="Students"
        value={summary.student_count}
        color="purple"
        disableHover
      />
      <StatCard
        icon={BarChart3}
        label="Avg Progress"
        value={`${summary.average_progress}%`}
        color="green"
        disableHover
      />
      <StatCard
        icon={ActivityIcon}
        label="Attendance vs Assign."
        value={`${attendanceAverage}% / ${assignmentAverage}%`}
        color="orange"
        disableHover
      />
    </section>
  ),
);

TutorStatsSection.displayName = 'TutorStatsSection';
