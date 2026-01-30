import { Card, CardContent } from '@/components/ui/card';
import type { TutorDashboardData } from '@/types';
import { BarChart3 } from 'lucide-react';
import { memo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface TutorActivityChartSectionProps {
  data: TutorDashboardData['chart'];
}

export const TutorActivityChartSection = memo(
  ({ data }: TutorActivityChartSectionProps) => (
    <section aria-labelledby="tutor-activity-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2
          id="tutor-activity-heading"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Course Activity (Attendance vs Quiz Completion)
        </h2>
      </div>
      <Card>
        <CardContent className="p-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap={18}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    strokeOpacity={0.25}
                  />
                  <XAxis
                    dataKey="course"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickMargin={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickMargin={6}
                    unit="%"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="attendance"
                    name="Attendance"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="quiz"
                    name="Quiz Completion"
                    fill="var(--chart-2)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  ),
);

TutorActivityChartSection.displayName = 'TutorActivityChartSection';
