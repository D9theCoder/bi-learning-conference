import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudentMeetingSchedule } from '@/types';
import { CalendarCheck, Clock } from 'lucide-react';
import { useMemo } from 'react';

interface ScheduleStudentViewProps {
  schedules: StudentMeetingSchedule[];
}

const formatScheduleDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusStyles: Record<StudentMeetingSchedule['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function ScheduleStudentView({ schedules }: ScheduleStudentViewProps) {
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming = schedules.filter(
      (schedule) =>
        schedule.status === 'scheduled' &&
        new Date(schedule.scheduled_at) >= now,
    );
    const past = schedules.filter(
      (schedule) =>
        schedule.status !== 'scheduled' ||
        new Date(schedule.scheduled_at) < now,
    );

    return { upcoming, past };
  }, [schedules]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Clock className="h-5 w-5 text-yellow-600" />
              Upcoming Meetings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your next 1:1 sessions with the tutor.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground dark:border-gray-700">
              No upcoming meetings yet. Check back soon.
            </div>
          ) : (
            upcoming.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {schedule.title}
                    </p>
                    <Badge className={statusStyles[schedule.status]}>
                      {schedule.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatScheduleDate(schedule.scheduled_at)}
                    {schedule.duration_minutes
                      ? ` • ${schedule.duration_minutes} min`
                      : ''}
                  </p>
                </div>
                {schedule.meeting_url && (
                  <Button asChild size="sm">
                    <a
                      href={schedule.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join Meeting
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            Past Meetings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Past meetings will appear here once completed.
            </p>
          ) : (
            past.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-white/70 px-3 py-3 text-sm dark:bg-gray-900/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {schedule.title}
                    </p>
                    <Badge className={statusStyles[schedule.status]}>
                      {schedule.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatScheduleDate(schedule.scheduled_at)}
                  </p>
                </div>
                {schedule.meeting_url && (
                  <Button asChild size="sm" variant="secondary">
                    <a
                      href={schedule.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Link
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
