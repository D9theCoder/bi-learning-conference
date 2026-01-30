import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SuccessModal } from '@/components/ui/success-modal';
import type { StudentMeetingSchedule } from '@/types';
import { router } from '@inertiajs/react';
import { CalendarClock, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface MeetingCardProps {
  lessonId: number;
  schedule: StudentMeetingSchedule;
  hasAttended?: boolean;
  isAdmin: boolean;
  isTutor: boolean;
}

export function MeetingCard({
  lessonId,
  schedule,
  hasAttended,
  isAdmin,
  isTutor,
}: MeetingCardProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const now = new Date();

  const startTime = schedule.scheduled_at
    ? new Date(schedule.scheduled_at.substring(0, 19))
    : null;
  const endTime =
    startTime && schedule.duration_minutes
      ? new Date(startTime.getTime() + schedule.duration_minutes * 60000)
      : null;

  const isCancelled = schedule.status === 'cancelled';
  const isCompleted = schedule.status === 'completed';
  const isActive =
    !!startTime &&
    schedule.status === 'scheduled' &&
    (!endTime || (now >= startTime && now <= endTime));
  const isPast =
    !!startTime && schedule.status === 'scheduled' && endTime && now > endTime;
  const isFuture =
    !!startTime && schedule.status === 'scheduled' && now < startTime;
  const statusLabel = isCancelled
    ? 'Cancelled'
    : isCompleted
      ? 'Completed'
      : isActive
        ? 'Live now'
        : isPast
          ? 'Ended'
          : isFuture
            ? 'Upcoming'
            : 'Scheduled';
  const statusClass = isCancelled
    ? 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
    : isCompleted
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200'
      : isActive
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200'
        : isPast
          ? 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
          : isFuture
            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/30 dark:text-amber-200'
            : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-200';

  const handleJoinMeeting = () => {
    if (!schedule.meeting_url) {
      return;
    }

    router.post(
      `/lessons/${lessonId}/attend`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          if (schedule.meeting_url) {
            window.open(schedule.meeting_url, '_blank');
          }
          setShowSuccessModal(true);
        },
        onError: (errors) => {
          console.error('Failed to mark attendance:', errors);
          alert('Failed to mark attendance. Please try again.');
        },
      },
    );
  };

  const handleDebugAttend = () => {
    router.post(
      `/lessons/${lessonId}/attend`,
      {},
      {
        preserveScroll: true,
        onError: (errors) => {
          console.error('Failed to mark attendance:', errors);
          alert('Failed to mark attendance: ' + JSON.stringify(errors));
        },
      },
    );
  };

  return (
    <>
      <Card className="border-border/60 bg-blue-50 shadow-sm dark:bg-slate-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Meeting
            </CardTitle>
            <Badge variant="outline" className={statusClass}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {startTime && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CalendarClock className="mt-0.5 h-4 w-4 text-blue-500" />
                <span>
                  {startTime.toLocaleString()}
                  {endTime ? ` - ${endTime.toLocaleTimeString()}` : null}
                </span>
              </div>
            )}
            {hasAttended && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>Attendance confirmed</span>
              </div>
            )}
            {isCancelled ? (
              <Button disabled className="w-full">
                Meeting Cancelled
              </Button>
            ) : isCompleted ? (
              <Button disabled className="w-full">
                Meeting Completed
              </Button>
            ) : !schedule.meeting_url ? (
              <Button disabled className="w-full">
                Meeting Link Pending
              </Button>
            ) : isActive ? (
              <Button
                onClick={handleJoinMeeting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Join Meeting
              </Button>
            ) : isPast ? (
              <Button disabled className="w-full">
                Meeting Ended
              </Button>
            ) : isFuture ? (
              <Button disabled className="w-full">
                Starts {startTime?.toLocaleString()}
              </Button>
            ) : (
              <Button
                onClick={handleJoinMeeting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Join Meeting
              </Button>
            )}

            {/* {!isAdmin && !isTutor && (
              <Button
                onClick={handleDebugAttend}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                [DEBUG] Mark Attendance
              </Button>
            )} */}
          </div>
        </CardContent>
      </Card>

      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Attendance confirmed!"
        description="You're marked as attended. The meeting should be open in a new tab."
      />
    </>
  );
}
