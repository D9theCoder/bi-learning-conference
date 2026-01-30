import { PowerupSelector } from '@/components/courses/quiz/powerup-selector';
import { Button } from '@/components/ui/button';
import { DateTimePicker24h } from '@/components/ui/date-time-picker';
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
import type { CourseContent, Powerup } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { toast } from 'sonner';

const contentTypes = [
  { value: 'file', label: 'File' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'assessment', label: 'Assessment' },
];

const formatDateTimeLocal = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

interface ContentRowProps {
  courseId: number;
  lessonId: number;
  content: CourseContent;
  availablePowerups?: Powerup[];
}

export function ContentRow({
  courseId,
  lessonId,
  content,
  availablePowerups = [],
}: ContentRowProps) {
  const contentForm = useForm<{
    title: string;
    type: CourseContent['type'];
    file_path: File | string | null;
    url: string;
    description: string;
    due_date: string;
    duration_minutes: number | '';
    is_required: boolean;
    // Assessment-specific fields
    assessment_type: 'practice' | 'quiz' | 'final_exam';
    max_score: number | '';
    weight_percentage: number | '';
    allow_powerups: boolean;
    allowed_powerups: Array<{ id: number; limit: number }>;
  }>({
    title: content.title ?? '',
    type: content.type ?? 'file',
    file_path: content.file_path ?? '',
    url: content.url ?? '',
    description: content.description ?? '',
    due_date: formatDateTimeLocal(content.due_date),
    duration_minutes: content.duration_minutes ?? '',
    is_required: content.is_required ?? false,
    assessment_type: content.assessment_type ?? 'quiz',
    max_score: content.max_score ?? 100,
    weight_percentage: content.weight_percentage ?? '',
    allow_powerups: content.allow_powerups ?? true,
    allowed_powerups: content.allowed_powerups ?? [],
  });

  const isAssessment = contentForm.data.type === 'assessment';

  useEffect(() => {
    const isAssessmentType = contentForm.data.type === 'assessment';

    // Reset powerups when switching to final exam or away from assessment
    if (isAssessmentType && contentForm.data.assessment_type === 'final_exam') {
      contentForm.setData('allowed_powerups', []);
      contentForm.setData('allow_powerups', false);
      contentForm.setData('weight_percentage', '');
    } else if (!isAssessmentType) {
      contentForm.setData('allowed_powerups', []);
      contentForm.setData('allow_powerups', true);
      contentForm.setData('weight_percentage', '');
      contentForm.setData('max_score', 100);
    } else {
      contentForm.setData('max_score', 100);
    }
  }, [contentForm]);

  const saveContent = () => {
    contentForm.put(
      `/courses/manage/${courseId}/lessons/${lessonId}/contents/${content.id}`,
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Content updated successfully!'),
      },
    );
  };

  const deleteContent = () => {
    router.delete(
      `/courses/manage/${courseId}/lessons/${lessonId}/contents/${content.id}`,
      {
        preserveScroll: true,
      },
    );
  };

  const allowsPowerups =
    isAssessment && contentForm.data.assessment_type !== 'final_exam';

  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`content-title-${content.id}`}>Title</Label>
          <Input
            id={`content-title-${content.id}`}
            value={contentForm.data.title}
            onChange={(e) => contentForm.setData('title', e.target.value)}
          />
          {contentForm.errors.title ? (
            <p className="text-xs text-destructive">
              {contentForm.errors.title}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`content-type-${content.id}`}>Type</Label>
          <Select
            value={contentForm.data.type}
            onValueChange={(value) =>
              contentForm.setData('type', value as CourseContent['type'])
            }
          >
            <SelectTrigger id={`content-type-${content.id}`}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {contentTypes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contentForm.errors.type ? (
            <p className="text-xs text-destructive">
              {contentForm.errors.type}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 pt-3 lg:grid-cols-2">
        {(contentForm.data.type === 'video' ||
          contentForm.data.type === 'link') && (
          <div className="space-y-2">
            <Label htmlFor={`content-url-${content.id}`}>URL</Label>
            <Input
              id={`content-url-${content.id}`}
              value={contentForm.data.url ?? ''}
              onChange={(e) => contentForm.setData('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}
        {contentForm.data.type === 'file' && (
          <div className="space-y-2">
            <Label htmlFor={`content-file-${content.id}`}>File Upload</Label>
            <Input
              id={`content-file-${content.id}`}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  contentForm.setData('file_path', file);
                }
              }}
            />
            {typeof contentForm.data.file_path === 'string' &&
              contentForm.data.file_path && (
                <p className="text-xs text-muted-foreground">
                  Current: {contentForm.data.file_path}
                </p>
              )}
          </div>
        )}
        {isAssessment && (
          <div className="space-y-2">
            <Label htmlFor={`content-assessment-type-${content.id}`}>
              Assessment Type
            </Label>
            <Select
              value={contentForm.data.assessment_type}
              onValueChange={(value) =>
                contentForm.setData(
                  'assessment_type',
                  value as 'practice' | 'quiz' | 'final_exam',
                )
              }
            >
              <SelectTrigger id={`content-assessment-type-${content.id}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="final_exam">Final Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {isAssessment && (
          <div className="space-y-2">
            <Label htmlFor={`content-due-${content.id}`}>Due date</Label>
            <DateTimePicker24h
              value={contentForm.data.due_date}
              onChange={(date) => {
                if (date) {
                  contentForm.setData(
                    'due_date',
                    format(date, 'yyyy-MM-dd HH:mm:ss'),
                  );
                } else {
                  contentForm.setData('due_date', '');
                }
              }}
            />
            {contentForm.errors.due_date ? (
              <p className="text-xs text-destructive">
                {contentForm.errors.due_date}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {isAssessment && (
        <div className="grid gap-3 pt-3 lg:grid-cols-2">
          {contentForm.data.assessment_type === 'final_exam' && (
            <div className="space-y-2">
              <Label htmlFor={`content-weight-${content.id}`}>
                Final Exam Weight (%)
              </Label>
              <Input
                id={`content-weight-${content.id}`}
                type="number"
                min={51}
                max={100}
                value={contentForm.data.weight_percentage ?? ''}
                onChange={(e) =>
                  contentForm.setData(
                    'weight_percentage',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                placeholder="80"
              />
              {contentForm.errors.weight_percentage ? (
                <p className="text-xs text-destructive">
                  {contentForm.errors.weight_percentage}
                </p>
              ) : null}
            </div>
          )}
          {contentForm.data.assessment_type === 'final_exam' && (
            <div className="space-y-2">
              <Label htmlFor={`content-max-score-${content.id}`}>
                Max Score
              </Label>
              <Input
                id={`content-max-score-${content.id}`}
                type="number"
                min={1}
                value={contentForm.data.max_score ?? ''}
                onChange={(e) =>
                  contentForm.setData(
                    'max_score',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                placeholder="100"
              />
            </div>
          )}
        </div>
      )}

      {isAssessment && allowsPowerups && availablePowerups.length > 0 && (
        <div className="space-y-2 pt-3">
          <Label>Allowed Powerups</Label>
          <PowerupSelector
            availablePowerups={availablePowerups}
            selectedPowerups={contentForm.data.allowed_powerups}
            onChange={(powerups) =>
              contentForm.setData('allowed_powerups', powerups)
            }
          />
          <p className="text-xs text-muted-foreground">
            Optional: Select powerups students can use during this assessment
          </p>
        </div>
      )}

      {isAssessment && !allowsPowerups && (
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Powerups are disabled for final exams.
        </div>
      )}

      <div className="grid gap-3 pt-3 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor={`content-description-${content.id}`}>
            Description
          </Label>
          <Textarea
            id={`content-description-${content.id}`}
            rows={2}
            value={contentForm.data.description ?? ''}
            onChange={(e) => contentForm.setData('description', e.target.value)}
          />
          {contentForm.errors.description ? (
            <p className="text-xs text-destructive">
              {contentForm.errors.description}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          {!isAssessment && (
            <>
              <Label htmlFor={`content-duration-${content.id}`}>
                Duration (minutes)
              </Label>
              <Input
                id={`content-duration-${content.id}`}
                type="number"
                min={1}
                value={contentForm.data.duration_minutes ?? ''}
                onChange={(e) =>
                  contentForm.setData(
                    'duration_minutes',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={contentForm.data.is_required}
              onChange={(e) =>
                contentForm.setData('is_required', e.target.checked)
              }
            />
            Required
          </label>
          {contentForm.errors.duration_minutes ? (
            <p className="text-xs text-destructive">
              {contentForm.errors.duration_minutes}
            </p>
          ) : null}
          {contentForm.errors.is_required ? (
            <p className="text-xs text-destructive">
              {contentForm.errors.is_required}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={contentForm.processing}
          onClick={saveContent}
        >
          Save content
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={contentForm.processing}
          onClick={deleteContent}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
