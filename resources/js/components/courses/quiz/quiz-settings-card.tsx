import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Assessment, Powerup } from '@/types';
import type { InertiaFormProps } from '@inertiajs/react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import { PowerupSelector } from './powerup-selector';

type SettingsFormData = {
  type: 'practice' | 'quiz' | 'final_exam';
  title: string;
  description: string;
  lesson_id: number | '' | string;
  due_date: string;
  max_score: number;
  weight_percentage: number | '';
  allow_retakes: boolean;
  time_limit_minutes: number | '' | string;
  is_published: boolean;
  powerups: Array<{ id: number; limit: number }>;
};

interface QuizSettingsCardProps {
  form: InertiaFormProps<SettingsFormData>;
  assessment: Assessment;
  availablePowerups: Powerup[];
  lessons: Array<{ id: number; title: string; order: number | null }>;
  onSave: () => void;
}

export function QuizSettingsCard({
  form,
  assessment,
  availablePowerups,
  lessons,
  onSave,
}: QuizSettingsCardProps) {
  const handledErrors = [
    'type',
    'title',
    'description',
    'lesson_id',
    'due_date',
    'weight_percentage',
    'time_limit_minutes',
    'allow_retakes',
    'is_published',
    'powerups',
  ];

  const generalErrors = Object.entries(form.errors ?? {})
    .filter(
      ([field, message]) =>
        Boolean(message) &&
        !handledErrors.includes(field) &&
        !field.startsWith('powerups'),
    )
    .map(([, message]) => message as string);

  const powerupErrors = Object.entries(form.errors ?? {})
    .filter(
      ([field, message]) => Boolean(message) && field.startsWith('powerups'),
    )
    .map(([, message]) => message as string);

  const allowsPowerups = form.data.type !== 'final_exam';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assessment Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Assessment Type</Label>
          <Select
            value={form.data.type}
            onValueChange={(value) => {
              const nextType = value as SettingsFormData['type'];
              form.setData('type', nextType);
              if (nextType === 'final_exam') {
                form.setData('powerups', []);
              } else {
                form.setData('weight_percentage', '');
              }
            }}
          >
            <SelectTrigger id="type" aria-invalid={Boolean(form.errors.type)}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="final_exam">Final Exam</SelectItem>
            </SelectContent>
          </Select>
          {form.errors.type && (
            <p className="text-xs text-destructive">{form.errors.type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.data.title}
            onChange={(e) => form.setData('title', e.target.value)}
            aria-invalid={Boolean(form.errors.title)}
          />
          {form.errors.title && (
            <p className="text-xs text-destructive">{form.errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.data.description}
            onChange={(e) => form.setData('description', e.target.value)}
            rows={3}
            aria-invalid={Boolean(form.errors.description)}
          />
          {form.errors.description ? (
            <p className="text-xs text-destructive">
              {form.errors.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lesson_id">Assign to Session</Label>
          <Select
            value={form.data.lesson_id ? String(form.data.lesson_id) : 'none'}
            onValueChange={(value) =>
              form.setData('lesson_id', value === 'none' ? '' : Number(value))
            }
          >
            <SelectTrigger
              id="lesson_id"
              aria-invalid={Boolean(form.errors.lesson_id)}
            >
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.id} value={String(lesson.id)}>
                  {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose a session to show this assessment in the session todo list.
          </p>
          {form.errors.lesson_id ? (
            <p className="text-xs text-destructive">{form.errors.lesson_id}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date (optional)</Label>
          <DateTimePicker24h
            value={form.data.due_date}
            onChange={(date) => {
              if (date) {
                // Formatting for Laravel (YYYY-MM-DD HH:mm:ss)
                const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss');
                form.setData('due_date', formattedDate);
              } else {
                form.setData('due_date', '');
              }
            }}
          />
          {form.errors.due_date ? (
            <p className="text-xs text-destructive">{form.errors.due_date}</p>
          ) : null}
        </div>

        {form.data.type === 'final_exam' && (
          <div className="space-y-2">
            <Label htmlFor="weight_percentage">Final Exam Weight (%)</Label>
            <Input
              id="weight_percentage"
              type="number"
              min={51}
              max={100}
              value={form.data.weight_percentage}
              onChange={(e) =>
                form.setData(
                  'weight_percentage',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              aria-invalid={Boolean(form.errors.weight_percentage)}
            />
            <p className="text-xs text-muted-foreground">
              Quizzes share the remaining percentage of the final score.
            </p>
            {form.errors.weight_percentage ? (
              <p className="text-xs text-destructive">
                {form.errors.weight_percentage}
              </p>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="time_limit">Time Limit (minutes, optional)</Label>
          <Input
            id="time_limit"
            type="number"
            min={1}
            max={480}
            placeholder="No time limit"
            value={form.data.time_limit_minutes}
            onChange={(e) =>
              form.setData(
                'time_limit_minutes',
                e.target.value ? parseInt(e.target.value) : '',
              )
            }
            aria-invalid={Boolean(form.errors.time_limit_minutes)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for no time limit (due date only)
          </p>
          {form.errors.time_limit_minutes ? (
            <p className="text-xs text-destructive">
              {form.errors.time_limit_minutes}
            </p>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_retakes"
            checked={form.data.allow_retakes}
            onCheckedChange={(checked) =>
              form.setData('allow_retakes', !!checked)
            }
            aria-invalid={Boolean(form.errors.allow_retakes)}
          />
          <Label htmlFor="allow_retakes" className="cursor-pointer">
            Allow retakes (highest score kept)
          </Label>
          {form.errors.allow_retakes ? (
            <p className="text-xs text-destructive">
              {form.errors.allow_retakes}
            </p>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_published"
            checked={form.data.is_published}
            onCheckedChange={(checked) =>
              form.setData('is_published', !!checked)
            }
            aria-invalid={Boolean(form.errors.is_published)}
          />
          <Label htmlFor="is_published" className="cursor-pointer">
            Publish assessment (visible to students)
          </Label>
          {form.errors.is_published ? (
            <p className="text-xs text-destructive">
              {form.errors.is_published}
            </p>
          ) : null}
        </div>

        {allowsPowerups ? (
          <div className="space-y-2">
            <Label>Allowed Powerups</Label>
            <PowerupSelector
              availablePowerups={availablePowerups}
              selectedPowerups={form.data.powerups}
              onChange={(powerups) => form.setData('powerups', powerups)}
            />
            {powerupErrors.length > 0 ? (
              <div className="space-y-1 text-xs text-destructive">
                {powerupErrors.map((message, idx) => (
                  <div key={`${message}-${idx}`}>{message}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            Powerups are disabled for final exams.
          </div>
        )}

        {generalErrors.length > 0 ? (
          <div className="space-y-1 text-xs text-destructive">
            {generalErrors.map((message, idx) => (
              <div key={`${message}-${idx}`}>{message}</div>
            ))}
          </div>
        ) : null}

        <div className="border-t pt-4">
          <div className="mb-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">Assessment Summary</p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Questions: {assessment.questions?.length ?? 0}</p>
              <p>Total Points: {assessment.max_score}</p>
            </div>
          </div>
          <Button
            onClick={onSave}
            disabled={form.processing}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
