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
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const contentTypes = [
  { value: 'file', label: 'File' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'assessment', label: 'Assessment' },
];

interface NewContentFormProps {
  courseId: number;
  lessonId: number;
  availablePowerups?: Powerup[];
}

export function NewContentForm({
  courseId,
  lessonId,
  availablePowerups = [],
}: NewContentFormProps) {
  const newContentForm = useForm<{
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
    title: '',
    type: 'file',
    file_path: '',
    url: '',
    description: '',
    due_date: '',
    duration_minutes: '',
    is_required: false,
    assessment_type: 'quiz',
    max_score: 100,
    weight_percentage: '',
    allow_powerups: true,
    allowed_powerups: [],
  });

  const isAssessment = newContentForm.data.type === 'assessment';

  const handleTypeChange = (newType: CourseContent['type']) => {
    newContentForm.setData('type', newType);

    // Reset assessment-specific fields when switching away from assessment
    if (newType !== 'assessment') {
      newContentForm.setData({
        ...newContentForm.data,
        type: newType,
        allowed_powerups: [],
        allow_powerups: true,
        weight_percentage: '',
        max_score: 100,
      });
    }
  };

  const handleAssessmentTypeChange = (
    newAssessmentType: 'practice' | 'quiz' | 'final_exam',
  ) => {
    // Reset powerups and weight when switching to/from final exam
    if (newAssessmentType === 'final_exam') {
      newContentForm.setData({
        ...newContentForm.data,
        assessment_type: newAssessmentType,
        allowed_powerups: [],
        allow_powerups: false,
        weight_percentage: '',
      });
    } else {
      newContentForm.setData({
        ...newContentForm.data,
        assessment_type: newAssessmentType,
        max_score: 100,
      });
    }
  };

  const submitNewContent = () => {
    newContentForm.post(
      `/courses/manage/${courseId}/lessons/${lessonId}/contents`,
      {
        preserveScroll: true,
        onSuccess: () => {
          newContentForm.reset();
          toast.success('Content added successfully!');
        },
      },
    );
  };

  const allowsPowerups =
    isAssessment && newContentForm.data.assessment_type !== 'final_exam';

  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Add content</p>
      <div className="grid gap-3 pt-3 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`new-content-title-${lessonId}`}>Title</Label>
          <Input
            id={`new-content-title-${lessonId}`}
            value={newContentForm.data.title}
            onChange={(e) => newContentForm.setData('title', e.target.value)}
            placeholder="Content title"
          />
          {newContentForm.errors.title ? (
            <p className="text-xs text-destructive">
              {newContentForm.errors.title}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`new-content-type-${lessonId}`}>Type</Label>
          <Select
            value={newContentForm.data.type}
            onValueChange={(value) =>
              handleTypeChange(value as CourseContent['type'])
            }
          >
            <SelectTrigger id={`new-content-type-${lessonId}`}>
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
          {newContentForm.errors.type ? (
            <p className="text-xs text-destructive">
              {newContentForm.errors.type}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 pt-3 lg:grid-cols-2">
        {(newContentForm.data.type === 'video' ||
          newContentForm.data.type === 'link') && (
          <div className="space-y-2">
            <Label htmlFor={`new-content-url-${lessonId}`}>URL</Label>
            <Input
              id={`new-content-url-${lessonId}`}
              value={newContentForm.data.url ?? ''}
              onChange={(e) => newContentForm.setData('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}
        {newContentForm.data.type === 'file' && (
          <div className="space-y-2">
            <Label htmlFor={`new-content-file-${lessonId}`}>File Upload</Label>
            <Input
              id={`new-content-file-${lessonId}`}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  newContentForm.setData('file_path', file);
                }
              }}
            />
          </div>
        )}
        {isAssessment && (
          <div className="space-y-2">
            <Label htmlFor={`new-content-assessment-type-${lessonId}`}>
              Assessment Type
            </Label>
            <Select
              value={newContentForm.data.assessment_type}
              onValueChange={(value) =>
                handleAssessmentTypeChange(
                  value as 'practice' | 'quiz' | 'final_exam',
                )
              }
            >
              <SelectTrigger id={`new-content-assessment-type-${lessonId}`}>
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
            <Label htmlFor={`new-content-due-${lessonId}`}>Due date</Label>
            <DateTimePicker24h
              value={newContentForm.data.due_date}
              onChange={(date) => {
                if (date) {
                  newContentForm.setData(
                    'due_date',
                    format(date, 'yyyy-MM-dd HH:mm:ss'),
                  );
                } else {
                  newContentForm.setData('due_date', '');
                }
              }}
            />
            {newContentForm.errors.due_date ? (
              <p className="text-xs text-destructive">
                {newContentForm.errors.due_date}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {isAssessment && (
        <div className="grid gap-3 pt-3 lg:grid-cols-2">
          {newContentForm.data.assessment_type === 'final_exam' && (
            <div className="space-y-2">
              <Label htmlFor={`new-content-weight-${lessonId}`}>
                Final Exam Weight (%)
              </Label>
              <Input
                id={`new-content-weight-${lessonId}`}
                type="number"
                min={51}
                max={100}
                value={newContentForm.data.weight_percentage ?? ''}
                onChange={(e) =>
                  newContentForm.setData(
                    'weight_percentage',
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                placeholder="80"
              />
              {newContentForm.errors.weight_percentage ? (
                <p className="text-xs text-destructive">
                  {newContentForm.errors.weight_percentage}
                </p>
              ) : null}
            </div>
          )}
          {newContentForm.data.assessment_type === 'final_exam' && (
            <div className="space-y-2">
              <Label htmlFor={`new-content-max-score-${lessonId}`}>
                Max Score
              </Label>
              <Input
                id={`new-content-max-score-${lessonId}`}
                type="number"
                min={1}
                value={newContentForm.data.max_score ?? ''}
                onChange={(e) =>
                  newContentForm.setData(
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
            selectedPowerups={newContentForm.data.allowed_powerups}
            onChange={(powerups) =>
              newContentForm.setData('allowed_powerups', powerups)
            }
          />
          <p className="text-xs text-muted-foreground">
            Optional: Select powerups students can use during this assessment
          </p>
        </div>
      )}

      {isAssessment && !allowsPowerups && (
        <div className="mt-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Powerups are disabled for final exams.
        </div>
      )}

      <div className="grid gap-3 pt-3 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor={`new-content-description-${lessonId}`}>
            Description
          </Label>
          <Textarea
            id={`new-content-description-${lessonId}`}
            rows={2}
            value={newContentForm.data.description ?? ''}
            onChange={(e) =>
              newContentForm.setData('description', e.target.value)
            }
          />
          {newContentForm.errors.description ? (
            <p className="text-xs text-destructive">
              {newContentForm.errors.description}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          {!isAssessment && (
            <>
              <Label htmlFor={`new-content-duration-${lessonId}`}>
                Duration (minutes)
              </Label>
              <Input
                id={`new-content-duration-${lessonId}`}
                type="number"
                min={1}
                value={newContentForm.data.duration_minutes ?? ''}
                onChange={(e) =>
                  newContentForm.setData(
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
              checked={newContentForm.data.is_required}
              onChange={(e) =>
                newContentForm.setData('is_required', e.target.checked)
              }
            />
            Required
          </label>
          {newContentForm.errors.duration_minutes ? (
            <p className="text-xs text-destructive">
              {newContentForm.errors.duration_minutes}
            </p>
          ) : null}
          {newContentForm.errors.is_required ? (
            <p className="text-xs text-destructive">
              {newContentForm.errors.is_required}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={submitNewContent}
          disabled={newContentForm.processing}
          className="inline-flex items-center gap-2"
        >
          <Save className="size-4" />
          Add content
        </Button>
      </div>
    </div>
  );
}
