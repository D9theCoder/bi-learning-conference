import { Button } from '@/components/ui/button';
import { DateTimePicker24h } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Lesson, StudentMeetingSchedule } from '@/types';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface ScheduleFormDialogProps {
  courseId: number;
  studentId: number;
  studentName: string;
  lessons: Lesson[];
  schedule?: StudentMeetingSchedule;
  trigger: ReactNode;
}

const formatForInput = (value?: string | null) => {
  if (!value) return '';

  return value.replace('Z', '').substring(0, 16);
};

export function ScheduleFormDialog({
  courseId,
  studentId,
  studentName,
  lessons,
  schedule,
  trigger,
}: ScheduleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(schedule);

  const getScheduleFormData = () => ({
    student_id: studentId,
    lesson_id: schedule?.lesson_id?.toString() ?? '',
    title: schedule?.title ?? '',
    meeting_url: schedule?.meeting_url ?? '',
    scheduled_at: formatForInput(schedule?.scheduled_at) ?? '',
    duration_minutes: schedule?.duration_minutes?.toString() ?? '',
    notes: schedule?.notes ?? '',
    status: schedule?.status ?? 'scheduled',
  });

  const form = useForm(getScheduleFormData());

  useEffect(() => {
    if (!open) return;

    form.setData(getScheduleFormData());
    form.clearErrors();
  }, [open, schedule?.id, schedule?.updated_at, studentId]);

  const handleLessonChange = (lessonId: string) => {
    form.setData('lesson_id', lessonId);

    if (form.data.title.trim()) {
      return;
    }

    const lesson = lessons.find((item) => item.id.toString() === lessonId);
    if (lesson) {
      form.setData('title', lesson.title);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isEditing && schedule) {
      form.put(`/courses/${courseId}/schedules/${schedule.id}`, {
        preserveScroll: true,
        onSuccess: () => setOpen(false),
      });
      return;
    }

    form.post(`/courses/${courseId}/schedules`, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Update Meeting' : 'Schedule Meeting'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Edit the meeting details for ${studentName}.`
              : `Create a new 1:1 meeting for ${studentName}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={`schedule-title-${studentId}`}>
                Meeting title
              </Label>
              <Input
                id={`schedule-title-${studentId}`}
                value={form.data.title}
                onChange={(event) => form.setData('title', event.target.value)}
                placeholder="Coaching check-in"
              />
              {form.errors.title && (
                <p className="text-xs text-destructive">{form.errors.title}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>
                Lesson <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.data.lesson_id}
                onValueChange={handleLessonChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id.toString()}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.errors.lesson_id && (
                <p className="text-xs text-destructive">
                  {form.errors.lesson_id}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`schedule-datetime-${studentId}`}>
                Date & time
              </Label>
              <DateTimePicker24h
                value={form.data.scheduled_at}
                onChange={(date) => {
                  if (date) {
                    form.setData(
                      'scheduled_at',
                      format(date, 'yyyy-MM-dd HH:mm:ss'),
                    );
                  } else {
                    form.setData('scheduled_at', '');
                  }
                }}
              />
              {form.errors.scheduled_at && (
                <p className="text-xs text-destructive">
                  {form.errors.scheduled_at}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`schedule-duration-${studentId}`}>
                Duration (minutes)
              </Label>
              <Input
                id={`schedule-duration-${studentId}`}
                type="number"
                min={1}
                value={form.data.duration_minutes}
                onChange={(event) =>
                  form.setData('duration_minutes', event.target.value)
                }
                placeholder="45"
              />
              {form.errors.duration_minutes && (
                <p className="text-xs text-destructive">
                  {form.errors.duration_minutes}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`schedule-url-${studentId}`}>Meeting URL</Label>
              <Input
                id={`schedule-url-${studentId}`}
                value={form.data.meeting_url}
                onChange={(event) =>
                  form.setData('meeting_url', event.target.value)
                }
                placeholder="https://meet.example.com/room"
              />
              {form.errors.meeting_url && (
                <p className="text-xs text-destructive">
                  {form.errors.meeting_url}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.data.status}
                onValueChange={(value) =>
                  form.setData(
                    'status',
                    value as 'scheduled' | 'completed' | 'cancelled',
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {form.errors.status && (
                <p className="text-xs text-destructive">{form.errors.status}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`schedule-notes-${studentId}`}>Notes</Label>
              <Textarea
                id={`schedule-notes-${studentId}`}
                value={form.data.notes}
                onChange={(event) => form.setData('notes', event.target.value)}
                placeholder="Focus topics or preparation notes."
              />
              {form.errors.notes && (
                <p className="text-xs text-destructive">{form.errors.notes}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.processing}>
                {form.processing && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Save Changes' : 'Schedule Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
