import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CourseContent, Lesson, Powerup } from '@/types';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { LessonCard } from './lesson-card';

type LessonWithContents = Lesson & { contents?: CourseContent[] };

interface LessonsSectionProps {
  courseId: number;
  lessons: LessonWithContents[];
  availablePowerups?: Powerup[];
}

export function LessonsSection({
  courseId,
  lessons,
  availablePowerups = [],
}: LessonsSectionProps) {
  const lessonForm = useForm({
    title: '',
    description: '',
    duration_minutes: '',
    order: '',
    video_url: '',
  });

  const submitLesson = () => {
    lessonForm.transform((data) => ({
      ...data,
      order: data.order === '' ? null : Number(data.order),
      duration_minutes:
        data.duration_minutes === '' ? null : Number(data.duration_minutes),
    }));

    lessonForm.post(`/courses/manage/${courseId}/lessons`, {
      preserveScroll: true,
      onSuccess: () => {
        lessonForm.reset();
        toast.success('Lesson added successfully!');
      },
      onFinish: () => lessonForm.transform((data) => data),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Lessons & content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">Add lesson</p>
          <div className="grid gap-3 pt-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-lesson-title">Title</Label>
              <Input
                id="new-lesson-title"
                value={lessonForm.data.title}
                onChange={(e) => lessonForm.setData('title', e.target.value)}
                placeholder="Lesson title"
                aria-invalid={Boolean(lessonForm.errors.title)}
              />
              {lessonForm.errors.title ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.title}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-lesson-order">Order</Label>
              <Input
                id="new-lesson-order"
                type="number"
                min={1}
                value={
                  lessonForm.data.order === ''
                    ? ''
                    : String(lessonForm.data.order)
                }
                onChange={(e) => lessonForm.setData('order', e.target.value)}
                aria-invalid={Boolean(lessonForm.errors.order)}
              />
              {lessonForm.errors.order ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.order}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 pt-3 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-lesson-description">Description</Label>
              <Textarea
                id="new-lesson-description"
                rows={3}
                value={lessonForm.data.description ?? ''}
                onChange={(e) =>
                  lessonForm.setData('description', e.target.value)
                }
                aria-invalid={Boolean(lessonForm.errors.description)}
              />
              {lessonForm.errors.description ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.description}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-lesson-duration">Duration (minutes)</Label>
              <Input
                id="new-lesson-duration"
                type="number"
                min={1}
                value={
                  lessonForm.data.duration_minutes === ''
                    ? ''
                    : String(lessonForm.data.duration_minutes)
                }
                onChange={(e) =>
                  lessonForm.setData('duration_minutes', e.target.value)
                }
                aria-invalid={Boolean(lessonForm.errors.duration_minutes)}
              />
              {lessonForm.errors.duration_minutes ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.duration_minutes}
                </p>
              ) : null}
              <Label htmlFor="new-lesson-video">Video URL</Label>
              <Input
                id="new-lesson-video"
                value={lessonForm.data.video_url ?? ''}
                onChange={(e) =>
                  lessonForm.setData('video_url', e.target.value)
                }
                placeholder="https://..."
                aria-invalid={Boolean(lessonForm.errors.video_url)}
              />
              {lessonForm.errors.video_url ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.video_url}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button
              size="sm"
              onClick={submitLesson}
              disabled={lessonForm.processing}
              className="inline-flex items-center gap-2"
            >
              <Save className="size-4" />
              Add lesson
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {lessons && lessons.length > 0 ? (
            lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                courseId={courseId}
                lesson={lesson}
                availablePowerups={availablePowerups}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No lessons yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
