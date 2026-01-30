import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Assessment, CourseContent, Lesson, Powerup } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ContentRow } from './content-row';
import { NewContentForm } from './new-content-form';

type LessonWithContents = Lesson & {
  contents?: CourseContent[];
  assessments?: Assessment[];
};

interface LessonCardProps {
  courseId: number;
  lesson: LessonWithContents;
  availablePowerups?: Powerup[];
}

export function LessonCard({
  courseId,
  lesson,
  availablePowerups = [],
}: LessonCardProps) {
  const lessonForm = useForm<{
    title: string;
    description: string;
    duration_minutes: number | '';
    order: number | '';
    video_url: string;
  }>({
    title: lesson.title ?? '',
    description: lesson.description ?? '',
    duration_minutes: lesson.duration_minutes ?? '',
    order: lesson.order ?? '',
    video_url: lesson.video_url ?? '',
  });

  const saveLesson = () => {
    lessonForm.put(`/courses/manage/${courseId}/lessons/${lesson.id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Lesson updated successfully!'),
    });
  };

  const deleteLesson = () => {
    router.delete(`/courses/manage/${courseId}/lessons/${lesson.id}`, {
      preserveScroll: true,
    });
  };

  const visibleContents = (lesson.contents ?? []).filter(
    (content) => content.type !== 'assessment',
  );
  const assessments = lesson.assessments ?? [];

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson title</Label>
              <Input
                id={`lesson-title-${lesson.id}`}
                value={lessonForm.data.title}
                onChange={(e) => lessonForm.setData('title', e.target.value)}
              />
              {lessonForm.errors.title ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.title}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lesson-order-${lesson.id}`}>Order</Label>
              <Input
                id={`lesson-order-${lesson.id}`}
                type="number"
                min={1}
                value={lessonForm.data.order ?? ''}
                onChange={(e) =>
                  lessonForm.setData(
                    'order',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
              {lessonForm.errors.order ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.order}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor={`lesson-description-${lesson.id}`}>
                Description
              </Label>
              <Textarea
                id={`lesson-description-${lesson.id}`}
                rows={3}
                value={lessonForm.data.description ?? ''}
                onChange={(e) =>
                  lessonForm.setData('description', e.target.value)
                }
              />
              {lessonForm.errors.description ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.description}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lesson-duration-${lesson.id}`}>
                Duration (minutes)
              </Label>
              <Input
                id={`lesson-duration-${lesson.id}`}
                type="number"
                min={1}
                value={lessonForm.data.duration_minutes ?? ''}
                onChange={(e) =>
                  lessonForm.setData(
                    'duration_minutes',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
              <Label htmlFor={`lesson-video-${lesson.id}`}>Video URL</Label>
              <Input
                id={`lesson-video-${lesson.id}`}
                value={lessonForm.data.video_url ?? ''}
                onChange={(e) =>
                  lessonForm.setData('video_url', e.target.value)
                }
                placeholder="https://..."
              />
              {lessonForm.errors.duration_minutes ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.duration_minutes}
                </p>
              ) : null}
              {lessonForm.errors.video_url ? (
                <p className="text-xs text-destructive">
                  {lessonForm.errors.video_url}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={lessonForm.processing}
              onClick={saveLesson}
            >
              Save lesson
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={lessonForm.processing}
              onClick={deleteLesson}
            >
              Delete lesson
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Contents</p>
        {visibleContents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {visibleContents.map((content) => (
              <ContentRow
                key={content.id}
                courseId={courseId}
                lessonId={lesson.id}
                content={content}
                availablePowerups={availablePowerups}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No contents yet.</p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Assessments</p>
          {assessments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {assessments.map((assessment) => {
                const typeLabel =
                  assessment.type === 'practice'
                    ? 'Practice'
                    : assessment.type === 'final_exam'
                      ? 'Final Exam'
                      : 'Quiz';
                const dueDate = assessment.due_date
                  ? new Date(assessment.due_date).toLocaleDateString()
                  : null;

                return (
                  <div
                    key={assessment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {assessment.title}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {typeLabel}
                        </span>
                        {dueDate ? (
                          <span className="text-xs text-muted-foreground">
                            Due {dueDate}
                          </span>
                        ) : null}
                      </div>
                      {assessment.description ? (
                        <p className="text-xs text-muted-foreground">
                          {assessment.description}
                        </p>
                      ) : null}
                    </div>
                    <Button size="sm" variant="secondary" asChild>
                      <Link
                        href={`/courses/${courseId}/quiz/${assessment.id}/edit`}
                      >
                        Edit assessment
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No assessments yet.</p>
          )}
        </div>

        <NewContentForm
          courseId={courseId}
          lessonId={lesson.id}
          availablePowerups={availablePowerups}
        />
      </div>
    </div>
  );
}
