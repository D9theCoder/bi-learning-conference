import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Video,
  XCircle,
} from 'lucide-react';

interface CalendarOverviewCardProps {
  stats: {
    total: number;
    completed: number;
    overdue: number;
    meetings: number;
    assessments: number;
  };
}

export function CalendarOverviewCard({ stats }: CalendarOverviewCardProps) {
  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: CalendarCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Meetings',
      value: stats.meetings,
      icon: Video,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Assessments',
      value: stats.assessments,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-lg p-2"
            >
              <div className={`rounded-full p-1.5 ${item.bgColor}`}>
                <item.icon className={`size-4 ${item.color}`} />
              </div>
              <span className="text-lg font-bold">{item.value}</span>
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
