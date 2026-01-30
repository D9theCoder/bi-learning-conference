import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Link, type InertiaFormProps } from '@inertiajs/react';
import { Save } from 'lucide-react';

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

type CourseFormData = {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number | '' | string;
  thumbnail: string;
  is_published: boolean;
  instructor_id?: number | string | '';
};

interface CourseDetailsFormProps {
  form: InertiaFormProps<CourseFormData>;
  categories: Array<{ value: string; label: string }>;
  isEdit: boolean;
  onSubmit: () => void;
  availableTutors?: Array<{ id: number; name: string; avatar?: string }>;
  isAdmin?: boolean;
}

export function CourseDetailsForm({
  form,
  categories,
  isEdit,
  onSubmit,
  availableTutors = [],
  isAdmin = false,
}: CourseDetailsFormProps) {
  const fieldErrorKeys = [
    'title',
    'category',
    'description',
    'difficulty',
    'duration_minutes',
    'thumbnail',
    'is_published',
    'instructor_id',
  ];

  const generalErrors = Object.entries(form.errors ?? {})
    .filter(
      ([field, message]) => Boolean(message) && !fieldErrorKeys.includes(field),
    )
    .map(([, message]) => message as string);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Course details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.data.title}
              onChange={(e) => form.setData('title', e.target.value)}
              placeholder="Course title"
              aria-invalid={Boolean(form.errors.title)}
            />
            {form.errors.title ? (
              <p className="text-xs text-destructive">{form.errors.title}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.data.category}
              onValueChange={(value) => form.setData('category', value)}
            >
              <SelectTrigger
                id="category"
                aria-invalid={Boolean(form.errors.category)}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.category ? (
              <p className="text-xs text-destructive">{form.errors.category}</p>
            ) : null}
          </div>
          {isAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="instructor_id">Assign tutor *</Label>
              <Select
                value={
                  form.data.instructor_id ? String(form.data.instructor_id) : ''
                }
                onValueChange={(value) => form.setData('instructor_id', value)}
              >
                <SelectTrigger
                  id="instructor_id"
                  aria-invalid={Boolean(form.errors.instructor_id)}
                >
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {availableTutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={String(tutor.id)}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.errors.instructor_id ? (
                <p className="text-xs text-destructive">
                  {form.errors.instructor_id}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.data.description}
            onChange={(e) => form.setData('description', e.target.value)}
            placeholder="What will learners achieve?"
            rows={5}
            aria-invalid={Boolean(form.errors.description)}
          />
          {form.errors.description ? (
            <p className="text-xs text-destructive">
              {form.errors.description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={form.data.difficulty ?? ''}
              onValueChange={(value) => form.setData('difficulty', value)}
            >
              <SelectTrigger
                id="difficulty"
                aria-invalid={Boolean(form.errors.difficulty)}
              >
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.difficulty ? (
              <p className="text-xs text-destructive">
                {form.errors.difficulty}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              min={1}
              value={form.data.duration_minutes ?? ''}
              onChange={(e) =>
                form.setData('duration_minutes', Number(e.target.value) || '')
              }
              placeholder="e.g. 120"
              aria-invalid={Boolean(form.errors.duration_minutes)}
            />
            {form.errors.duration_minutes ? (
              <p className="text-xs text-destructive">
                {form.errors.duration_minutes}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              value={form.data.thumbnail ?? ''}
              onChange={(e) => form.setData('thumbnail', e.target.value)}
              placeholder="https://..."
              aria-invalid={Boolean(form.errors.thumbnail)}
            />
            {form.errors.thumbnail ? (
              <p className="text-xs text-destructive">
                {form.errors.thumbnail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_published"
            type="checkbox"
            className="size-4 rounded border-border"
            checked={form.data.is_published}
            onChange={(e) => form.setData('is_published', e.target.checked)}
            aria-invalid={Boolean(form.errors.is_published)}
          />
          <Label htmlFor="is_published" className="text-sm text-foreground">
            Publish course
          </Label>
        </div>

        {generalErrors.length > 0 ? (
          <div className="space-y-1 text-sm text-destructive">
            {generalErrors.map((message, idx) => (
              <div key={`${message}-${idx}`}>{message}</div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/courses/manage">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            onClick={onSubmit}
            disabled={form.processing}
            className="inline-flex items-center gap-2"
          >
            <Save className="size-4" />
            {isEdit ? 'Save changes' : 'Create course'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
