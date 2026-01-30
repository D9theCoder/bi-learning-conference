import { StatCard } from '@/components/dashboard/stat-card';
import type { LearningStats } from '@/types';
import { BookOpen, Clock, Flame, Zap } from 'lucide-react';
import { memo } from 'react';

interface DashboardStatsSectionProps {
  stats: LearningStats;
}

export const DashboardStatsSection = memo(
  ({ stats }: DashboardStatsSectionProps) => (
    <section
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      aria-label="Learning statistics"
    >
      <StatCard
        icon={Flame}
        label="Current Streak"
        value={`${stats.streak} days`}
        color="orange"
        animate={stats.streak > 0}
      />
      <StatCard
        icon={Zap}
        label="XP This Week"
        value={stats.xp_this_week}
        color="yellow"
      />
      <StatCard
        icon={Clock}
        label="Hours Learned"
        value={stats.hours_learned}
        color="blue"
      />
      <StatCard
        icon={BookOpen}
        label="Active Courses"
        value={stats.active_courses}
        color="purple"
      />
    </section>
  ),
);

DashboardStatsSection.displayName = 'DashboardStatsSection';
