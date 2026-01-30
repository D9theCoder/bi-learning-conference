import { MiniCalendar } from '@/components/calendar/mini-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalendarTask, StudentMeetingSchedule } from '@/types';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ScheduleCalendarViewProps {
  schedules: StudentMeetingSchedule[];
  title?: string;
}

const buildDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export function ScheduleCalendarView({
  schedules,
  title = 'Meeting Calendar',
}: ScheduleCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { tasksByDate, markers } = useMemo(() => {
    const tasksByDate: Record<string, CalendarTask[]> = {};

    schedules.forEach((schedule) => {
      const date = new Date(schedule.scheduled_at);
      const dateKey = buildDateKey(date);

      if (! tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }

      tasksByDate[dateKey].push({
        id: schedule.id,
        course_id: schedule.course_id,
        lesson_id: schedule.lesson_id ?? null,
        title: schedule.title,
        due_date: dateKey,
        completed:
          schedule.status === 'completed' || date.getTime() < Date.now(),
        category: 'meeting',
        time: date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        meeting_url: schedule.meeting_url ?? null,
      });
    });

    return {
      tasksByDate,
      markers: Object.keys(tasksByDate),
    };
  }, [schedules]);

  const selectedKey = buildDateKey(selectedDate);
  const selectedTasks = tasksByDate[selectedKey] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <CalendarDays className="h-4 w-4 text-yellow-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MiniCalendar
          currentDate={selectedDate}
          tasksByDate={tasksByDate}
          markers={markers}
          onDateSelect={setSelectedDate}
        />
        <div className="space-y-2">
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meetings scheduled on this day.
            </p>
          ) : (
            selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.time}</p>
                </div>
                {task.meeting_url && (
                  <a
                    className="text-xs font-semibold text-primary hover:underline"
                    href={task.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
