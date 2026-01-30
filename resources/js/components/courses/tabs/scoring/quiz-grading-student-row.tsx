import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AnswerConfig, Assessment, AssessmentAttempt, AssessmentQuestion } from '@/types';
import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';

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

function getMultipleChoiceLabel(
  question: AssessmentQuestion,
  value: unknown,
): string {
  if (value === null || value === undefined || String(value) === '') {
    return '';
  }

  if (!isMultipleChoiceConfig(question.answer_config)) {
    return String(value);
  }

  const index = Number(value);
  const option = Number.isFinite(index)
    ? question.answer_config.options[index]
    : undefined;

  return option ?? String(value);
}

function getFillBlankAnswerKey(question: AssessmentQuestion): string[] {
  if (!isFillBlankConfig(question.answer_config)) {
    return [];
  }

  const raw = question.answer_config.accepted_answers;

  return raw.map((answer) => normalizeFillBlank(answer));
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

function computeAutoPoints(question: AssessmentQuestion, answer: unknown): number {
  if (answer === null || answer === undefined || String(answer) === '') {
    return 0;
  }

  if (question.type === 'multiple_choice') {
    if (!isMultipleChoiceConfig(question.answer_config)) {
      return 0;
    }

    return Number(answer) === question.answer_config.correct_index
      ? question.points
      : 0;
  }

  if (question.type === 'fill_blank') {
    const normalizedAnswer = normalizeFillBlank(answer);
    const correctAnswers = getFillBlankAnswerKey(question);

    return correctAnswers.includes(normalizedAnswer) ? question.points : 0;
  }

  return 0;
}

type AttemptAnswers = Record<string, unknown> | null | undefined;

function getAnswer(answers: AttemptAnswers, questionId: number): unknown {
  if (!answers) {
    return null;
  }

  return (answers as Record<string, unknown>)[String(questionId)];
}

function getStoredGrade(
  answers: AttemptAnswers,
  questionId: number,
): number | null {
  if (!answers) {
    return null;
  }

  const key = `${questionId}_grade`;
  const raw = (answers as Record<string, unknown>)[key];

  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

interface QuizGradingStudentRowProps {
  student: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    [key: string]: unknown;
  };
  assessment: Assessment;
  attempt: AssessmentAttempt;
  questions: AssessmentQuestion[];
  grades: Record<string, string>;
  onGradeChange: (key: string, value: string) => void;
  onSave: (
    grades: Array<{ question_id: number; points: number }>,
    options: {
      onSuccess: () => void;
      onError?: () => void;
      onFinish?: () => void;
    },
  ) => void;
}

export function QuizGradingStudentRow({
  student,
  assessment,
  attempt,
  questions,
  grades,
  onGradeChange,
  onSave,
}: QuizGradingStudentRowProps) {
  const attemptAnswers = (attempt.answers as AttemptAnswers) ?? null;

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const statusBadge = attempt.completed_at
    ? attempt.is_graded
      ? { variant: 'default' as const, label: 'Graded' }
      : { variant: 'outline' as const, label: 'Needs grading' }
    : { variant: 'secondary' as const, label: 'In progress' };

  const validation = useMemo(() => {
    const issues: Record<number, string> = {};

    for (const q of questions) {
      const key = `${attempt.id}-${q.id}`;
      const raw = grades[key];

      if (raw === undefined || raw === '') {
        continue;
      }

      const parsed = Number(raw);

      if (!Number.isFinite(parsed)) {
        issues[q.id] = `Enter a number between 0 and ${q.points}.`;
        continue;
      }

      if (parsed < 0 || parsed > q.points) {
        issues[q.id] = `Must be between 0 and ${q.points}.`;
      }
    }

    return {
      issues,
      hasErrors: Object.keys(issues).length > 0,
    };
  }, [attempt.id, grades, questions]);

  return (
    <details className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <summary className="flex cursor-pointer items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarImage src={student.avatar} />
            <AvatarFallback>
              {String(student.name ?? '?').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{student.name}</p>
            <p className="truncate text-xs text-gray-500">{student.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {attempt.is_remedial && (
            <Badge variant="outline" className="text-xs">
              Remedial
            </Badge>
          )}
          <div className="text-right">
            <p className="text-sm font-semibold">
              {attempt.score ?? 0}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                /{assessment.max_score}
              </span>
              {attempt.completed_at && !attempt.is_graded && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                  Preliminary
                </span>
              )}
            </p>
            {attempt.completed_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Submitted: {new Date(attempt.completed_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </summary>

      <div className="flex flex-col gap-6 border-t p-4">
        <div className="grid gap-4">
          {questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((question) => {
              const answer = getAnswer(attemptAnswers, question.id);
              const existingGrade = getStoredGrade(attemptAnswers, question.id);
              const autoPoints = computeAutoPoints(question, answer);
              const gradeKey = `${attempt.id}-${question.id}`;

              const displayedGrade =
                grades[gradeKey] ??
                (existingGrade !== null
                  ? String(existingGrade)
                  : String(autoPoints));

              const error = validation.issues[question.id];

              return (
                <div
                  key={question.id}
                  className="rounded-lg border bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/20"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">
                        Q{question.order}: {question.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Type: {question.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Max: {question.points}</span>
                        {question.type === 'multiple_choice' &&
                          isMultipleChoiceConfig(question.answer_config) && (
                            <>
                              <span>•</span>
                              <span>
                                Answer key:{' '}
                                {getMultipleChoiceLabel(
                                  question,
                                  question.answer_config.correct_index,
                                )}
                              </span>
                            </>
                          )}
                        {question.type === 'fill_blank' && (
                          <>
                            <span>•</span>
                            <span>
                              Valid answers:{' '}
                              {getFillBlankAnswerDisplayList(question).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="md:col-span-3">
                        <Label className="text-xs">Student answer</Label>
                        {question.type === 'essay' ? (
                          <Textarea
                            value={String(answer ?? '')}
                            readOnly
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={
                              question.type === 'multiple_choice'
                                ? getMultipleChoiceLabel(question, answer)
                                : String(answer ?? '')
                            }
                            readOnly
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Awarded points</Label>
                        <Input
                          type="number"
                          min={0}
                          max={question.points}
                          value={displayedGrade}
                          onChange={(e) =>
                            onGradeChange(gradeKey, e.target.value)
                          }
                          className={
                            error
                              ? 'mt-1 border-red-500 focus-visible:ring-red-500/30'
                              : 'mt-1'
                          }
                        />
                        {error ? (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {error}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Defaults to auto-score for objective questions. Edit
                            to override.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="flex items-center justify-end">
          <Button
            size="sm"
            disabled={isSaving || validation.hasErrors}
            onClick={() => {
              setSaveError(null);
              setIsSaving(true);

              const payload = questions.map((q) => {
                const key = `${attempt.id}-${q.id}`;
                const answer = getAnswer(attemptAnswers, q.id);
                const existingGrade = getStoredGrade(attemptAnswers, q.id);
                const fallback =
                  existingGrade !== null
                    ? existingGrade
                    : computeAutoPoints(q, answer);

                const raw = grades[key];
                const parsed =
                  raw === undefined || raw === '' ? fallback : Number(raw);

                return {
                  question_id: q.id,
                  points: Number.isFinite(parsed)
                    ? Math.max(0, Math.min(parsed, q.points))
                    : 0,
                };
              });

              onSave(payload, {
                onSuccess: () => {
                  setIsSuccessOpen(true);
                },
                onError: () => {
                  setSaveError(
                    'Failed to save grades. Please check the inputs and try again.',
                  );
                },
                onFinish: () => {
                  setIsSaving(false);
                },
              });
            }}
            className={
              isSaving || validation.hasErrors
                ? 'bg-gray-400 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-700'
                : 'bg-green-600 hover:bg-green-700'
            }
          >
            <Save className="mr-1 h-4 w-4" />
            Save Grades
          </Button>
        </div>

        {saveError && (
          <p className="text-right text-sm text-red-600 dark:text-red-400">
            {saveError}
          </p>
        )}
      </div>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grades saved</DialogTitle>
            <DialogDescription>
              The scores for <strong>{student.name}</strong> were saved
              successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsSuccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
