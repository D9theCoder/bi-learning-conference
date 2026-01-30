import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

interface TaskStatsProps {
  stats: {
    total: number;
    completed: number;
    overdue: number;
  };
  className?: string;
}

export function TaskStats({ stats, className }: TaskStatsProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            <div className="text-2xl font-bold">{stats.completed}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-red-500" />
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
