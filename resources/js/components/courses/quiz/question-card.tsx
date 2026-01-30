import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AnswerConfig, AssessmentQuestion } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import {
  CheckCircle,
  GripVertical,
  HelpCircle,
  ListOrdered,
  PenLine,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const questionTypes = [
  {
    value: 'multiple_choice',
    label: 'Multiple Choice',
    icon: ListOrdered,
    description: 'Auto-graded, 4 options max',
  },
  {
    value: 'fill_blank',
    label: 'Fill in the Blank',
    icon: PenLine,
    description: 'Auto-graded, exact match',
  },
  {
    value: 'essay',
    label: 'Essay',
    icon: HelpCircle,
    description: 'Manual grading by tutor',
  },
] as const;

function normalizeFillBlank(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isMultipleChoiceConfig(
  config: AnswerConfig,
): config is { type: 'multiple_choice'; options: string[]; correct_index: number } {
  return config.type === 'multiple_choice';
}

function isFillBlankConfig(
  config: AnswerConfig,
): config is { type: 'fill_blank'; accepted_answers: string[] } {
  return config.type === 'fill_blank';
}

function getFillBlankAnswerDisplayList(question: AssessmentQuestion): string[] {
  if (!isFillBlankConfig(question.answer_config)) {
    return [];
  }

  const raw = question.answer_config.accepted_answers;

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const answer of raw) {
    const normalized = normalizeFillBlank(answer);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(String(answer));
  }

  return unique;
}

interface QuestionCardProps {
  question: AssessmentQuestion;
  index: number;
  courseId: number;
  assessmentId: number;
}

export function QuestionCard({
  question,
  index,
  courseId,
  assessmentId,
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const dragControls = useDragControls();
  const answerConfig = question.answer_config;
  const multipleChoiceConfig = isMultipleChoiceConfig(answerConfig)
    ? answerConfig
    : null;
  const fillBlankConfig = isFillBlankConfig(answerConfig) ? answerConfig : null;

  const form = useForm({
    type: question.type,
    question: question.question,
    options:
      question.type === 'fill_blank'
        ? fillBlankConfig && fillBlankConfig.accepted_answers.length > 0
          ? fillBlankConfig.accepted_answers
          : ['']
        : multipleChoiceConfig && multipleChoiceConfig.options.length > 0
          ? multipleChoiceConfig.options
          : ['', '', '', ''],
    correct_answer: multipleChoiceConfig
      ? String(multipleChoiceConfig.correct_index)
      : '',
    points: question.points,
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

  const handleSave = () => {
    form.put(
      `/courses/${courseId}/quiz/${assessmentId}/questions/${question.id}`,
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsEditing(false);
          toast.success('Question updated successfully!');
        },
      },
    );
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this question?')) {
      router.delete(
        `/courses/${courseId}/quiz/${assessmentId}/questions/${question.id}`,
        {
          preserveScroll: true,
        },
      );
    }
  };

  const typeConfig = questionTypes.find((t) => t.value === question.type);

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className="rounded-lg border bg-card p-4 shadow-sm will-change-transform"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <GripVertical
              className="h-5 w-5 cursor-grab text-muted-foreground select-none active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          </div>
          <div className="flex-1">
            <AnimatePresence initial={false} mode="popLayout">
              {isEditing ? (
                <motion.div
                  key="edit"
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  <Textarea
                    value={form.data.question}
                    onChange={(e) => form.setData('question', e.target.value)}
                    rows={2}
                    aria-invalid={Boolean(form.errors.question)}
                  />
                  {form.errors.question ? (
                    <p className="text-xs text-destructive">
                      {form.errors.question}
                    </p>
                  ) : null}

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {form.data.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_answer_${question.id}`}
                            checked={form.data.correct_answer === String(idx)}
                            onChange={() =>
                              form.setData('correct_answer', String(idx))
                            }
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
                              form.errors[
                                `options.${idx}` as keyof typeof form.errors
                              ],
                            )}
                          />
                        </div>
                      ))}
                      {optionErrors.length > 0 ? (
                        <div className="space-y-1 text-xs text-destructive">
                          {optionErrors.map((message, errorIndex) => (
                            <p key={`${message}-${errorIndex}`}>{message}</p>
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

                  {question.type === 'fill_blank' && (
                    <div className="space-y-2">
                      <Label>Correct Answers (multiple allowed)</Label>
                      {(form.data.options && form.data.options.length > 0
                        ? form.data.options
                        : ['']
                      ).map((answer, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={answer}
                            onChange={(e) => {
                              const newOptions = [
                                ...(form.data.options || ['']),
                              ];
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
                                const newOptions = [
                                  ...(form.data.options || ['']),
                                ];
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Points:</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.data.points}
                        onChange={(e) =>
                          form.setData('points', parseInt(e.target.value) || 1)
                        }
                        className="w-20"
                        aria-invalid={Boolean(form.errors.points)}
                      />
                      {form.errors.points ? (
                        <p className="text-xs text-destructive">
                          {form.errors.points}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={form.processing}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {generalErrors.length > 0 ? (
                    <div className="space-y-1 text-xs text-destructive">
                      {generalErrors.map((message, errorIndex) => (
                        <p key={`${message}-${errorIndex}`}>{message}</p>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-2">
                    {typeConfig && (
                      <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                        <typeConfig.icon className="h-3 w-3" />
                        {typeConfig.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {question.points} pt{question.points > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{question.question}</p>

                  {question.type === 'multiple_choice' &&
                    multipleChoiceConfig && (
                    <div className="mt-2 space-y-1">
                      {multipleChoiceConfig.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                            multipleChoiceConfig.correct_index === idx
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {multipleChoiceConfig.correct_index === idx ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                          {option}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'fill_blank' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Valid Answers:
                      </p>
                      {getFillBlankAnswerDisplayList(question).map(
                        (answer, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • {answer}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!isEditing && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <PenLine className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}
