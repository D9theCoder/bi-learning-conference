import { MiniChart } from '@/components/dashboard/mini-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Activity as ActivityIcon } from 'lucide-react';
import { memo } from 'react';

const CHART_HEIGHT = 200;

interface DashboardActivityChartSectionProps {
  weeklyActivityData: { name: string; value: number }[];
}

export const DashboardActivityChartSection = memo(
  ({ weeklyActivityData }: DashboardActivityChartSectionProps) => (
    <section aria-labelledby="activity-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <ActivityIcon className="size-5 text-primary" />
        <h2
          id="activity-heading"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Weekly Activity
        </h2>
      </div>
      <Card>
        <CardContent>
          <MiniChart
            data={weeklyActivityData}
            type="area"
            height={CHART_HEIGHT}
            xAxisLabel="Day"
            yAxisLabel="XP"
            showGrid
            showAxes
            showAxisLabels
            compact
          />
        </CardContent>
      </Card>
    </section>
  ),
);

DashboardActivityChartSection.displayName = 'DashboardActivityChartSection';
