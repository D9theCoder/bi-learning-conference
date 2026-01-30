import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashedEmptyState } from '@/components/courses/shared';
import type {
  Lesson,
  StudentMeetingSchedule,
  StudentWithSubmissions,
} from '@/types';
import { router } from '@inertiajs/react';
import { CalendarPlus, CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import { ScheduleFormDialog } from './schedule-form-dialog';

interface ScheduleTutorViewProps {
  courseId: number;
  lessons: Lesson[];
  students: StudentWithSubmissions[];
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

export function ScheduleTutorView({
  courseId,
  lessons,
  students,
}: ScheduleTutorViewProps) {
  const handleStatusChange = (
    schedule: StudentMeetingSchedule,
    status: StudentMeetingSchedule['status'],
  ) => {
    router.put(
      `/courses/${courseId}/schedules/${schedule.id}`,
      { status, lesson_id: schedule.lesson_id },
      { preserveScroll: true },
    );
  };

  const handleDelete = (scheduleId: number) => {
    router.delete(`/courses/${courseId}/schedules/${scheduleId}`, {
      preserveScroll: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <CalendarPlus className="h-5 w-5 text-yellow-600" />
          Schedule Management
        </CardTitle>
        <p className="text-sm text-gray-500">
          Manage 1:1 meeting times for each student.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {students.length === 0 ? (
          <DashedEmptyState message="No students enrolled yet." />
        ) : (
          students.map((student) => {
            const schedules = student.meeting_schedules ?? [];

            return (
              <div
                key={student.id}
                className="rounded-xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-gray-900/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback>
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <ScheduleFormDialog
                    courseId={courseId}
                    lessons={lessons}
                    studentId={student.id}
                    studentName={student.name}
                    trigger={
                      <Button size="sm" className="gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Add Meeting
                      </Button>
                    }
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {schedules.length === 0 ? (
                    <DashedEmptyState message="No meetings scheduled for this student." />
                  ) : (
                    schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
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
                        <div className="flex flex-wrap items-center gap-2">
                          <ScheduleFormDialog
                            courseId={courseId}
                            lessons={lessons}
                            studentId={student.id}
                            studentName={student.name}
                            schedule={schedule}
                            trigger={
                              <Button size="icon-sm" variant="outline">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(schedule, 'completed')
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(schedule, 'cancelled')
                            }
                          >
                            <XCircle className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          {schedule.meeting_url && (
                            <Button asChild size="sm" variant="secondary">
                              <a
                                href={schedule.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
