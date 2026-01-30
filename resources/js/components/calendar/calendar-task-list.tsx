import { TaskDateCard } from '@/components/calendar/task-date-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalendarTask } from '@/types';
import { CalendarDays } from 'lucide-react';

interface CalendarTaskListProps {
  isFiltered: boolean;
  activeDateLabel: string | null;
  filteredDates: string[];
  tasksByDate: Record<string, CalendarTask[]>;
  showCourseLegend?: boolean;
}

export function CalendarTaskList({
  isFiltered,
  filteredDates,
  tasksByDate,
  showCourseLegend = false,
}: CalendarTaskListProps) {
  return (
    <Card className="h-fit px-4">
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <CalendarDays className="size-3.5 text-primary" />
            {isFiltered ? 'Selected' : 'Scheduled'}
          </CardTitle>
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <span className="size-1.5 bg-blue-500" />
              Meet
            </span>
            <span className="flex items-center gap-0.5">
              <span className="size-1.5 bg-orange-500" />
              Assess
            </span>
            <span className="flex items-center gap-0.5">
              <span className="size-1.5 bg-green-500" />
              Task
            </span>
            {showCourseLegend && (
              <span className="flex items-center gap-0.5">
                <span className="size-1.5 bg-violet-500" />
                Course
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pt-0 pb-2">
        {filteredDates.length > 0 ? (
          filteredDates.map((date) => (
            <TaskDateCard key={date} date={date} tasks={tasksByDate[date]} />
          ))
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-2 text-center text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {isFiltered ? 'No items' : 'Clear'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
