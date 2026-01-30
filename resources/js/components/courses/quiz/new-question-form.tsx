import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface NewQuestionFormProps {
  courseId: number;
  assessmentId: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  onCancel: () => void;
  onSuccess: () => void;
}

export function NewQuestionForm({
  courseId,
  assessmentId,
  type,
  onCancel,
  onSuccess,
}: NewQuestionFormProps) {
  const form = useForm({
    type,
    question: '',
    options: type === 'fill_blank' ? [''] : ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });

  const optionErrors = Object.entries(form.errors)
    .filter(([field]) => field.startsWith('options'))
    .map(([, message]) => message);

  const generalErrors = Object.entries(form.errors)
    .filter(
      ([field, message]) =>
        Boolean(message) &&
        !['question', 'correct_answer', 'points'].includes(field) &&
        !field.startsWith('options'),
    )
    .map(([, message]) => message);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(`/courses/${courseId}/quiz/${assessmentId}/questions`, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        toast.success('Question added successfully!');
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-question">Question</Label>
        <Textarea
          id="new-question"
          value={form.data.question}
          onChange={(e) => form.setData('question', e.target.value)}
          placeholder="Enter your question..."
          rows={3}
          aria-invalid={Boolean(form.errors.question)}
        />
        {form.errors.question && (
          <p className="text-xs text-destructive">{form.errors.question}</p>
        )}
      </div>

      {type === 'multiple_choice' && (
        <div className="space-y-2">
          <Label>Options (select the correct one)</Label>
          {form.data.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct_answer"
                checked={form.data.correct_answer === String(idx)}
                onChange={() => form.setData('correct_answer', String(idx))}
                className="h-4 w-4"
                aria-invalid={Boolean(form.errors.correct_answer)}
              />
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...form.data.options];
                  newOptions[idx] = e.target.value;
                  form.setData('options', newOptions);
                }}
                placeholder={`Option ${idx + 1}`}
                aria-invalid={Boolean(
                  form.errors[`options.${idx}` as keyof typeof form.errors],
                )}
              />
            </div>
          ))}
          {optionErrors.length > 0 ? (
            <div className="space-y-1 text-xs text-destructive">
              {optionErrors.map((message, index) => (
                <p key={`${message}-${index}`}>{message}</p>
              ))}
            </div>
          ) : null}
          {form.errors.correct_answer ? (
            <p className="text-xs text-destructive">
              {form.errors.correct_answer}
            </p>
          ) : null}
        </div>
      )}

      {type === 'fill_blank' && (
        <div className="space-y-2">
          <Label htmlFor="correct-answer">
            Correct Answers (multiple allowed)
          </Label>
          {(form.data.options && form.data.options.length > 0
            ? form.data.options
            : ['']
          ).map((answer, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={answer}
                onChange={(e) => {
                  const newOptions = [...(form.data.options || [''])];
                  newOptions[idx] = e.target.value;
                  form.setData('options', newOptions);
                }}
                placeholder={`Answer ${idx + 1}`}
                aria-invalid={Boolean(form.errors.correct_answer)}
              />
              {idx > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    const newOptions = [...(form.data.options || [''])];
                    newOptions.splice(idx, 1);
                    form.setData('options', newOptions);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              const newOptions = [...(form.data.options || [''])];
              newOptions.push('');
              form.setData('options', newOptions);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Answer
          </Button>
          <p className="text-xs text-muted-foreground">
            Student answer will match any of these (case-insensitive)
          </p>
          {form.errors.correct_answer ? (
            <p className="text-xs text-destructive">
              {form.errors.correct_answer}
            </p>
          ) : null}
        </div>
      )}

      {type === 'essay' && (
        <p className="text-sm text-muted-foreground">
          Essay answers will require manual grading by the tutor.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="points">Points</Label>
        <Input
          id="points"
          type="number"
          min={1}
          value={form.data.points}
          onChange={(e) =>
            form.setData('points', parseInt(e.target.value) || 1)
          }
          className="w-24"
          aria-invalid={Boolean(form.errors.points)}
        />
        {form.errors.points ? (
          <p className="text-xs text-destructive">{form.errors.points}</p>
        ) : null}
      </div>

      {generalErrors.length > 0 ? (
        <div className="space-y-1 text-xs text-destructive">
          {generalErrors.map((message, idx) => (
            <p key={`${message}-${idx}`}>{message}</p>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.processing}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>
    </form>
  );
}
