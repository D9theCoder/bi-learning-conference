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
import type {
  AnswerConfig,
  Assessment,
  AssessmentAttempt,
  AssessmentQuestion,
} from '@/types';

interface QuizAnswerReviewDialogProps {
  assessment: Assessment;
  attempt: AssessmentAttempt;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AttemptAnswers = Record<string, unknown> | null | undefined;

function normalizeFillBlank(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isMultipleChoiceConfig(
  config: AnswerConfig,
): config is {
  type: 'multiple_choice';
  options: string[];
  correct_index: number;
} {
  return config.type === 'multiple_choice';
}

function isFillBlankConfig(
  config: AnswerConfig,
): config is { type: 'fill_blank'; accepted_answers: string[] } {
  return config.type === 'fill_blank';
}

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

function computeAutoPoints(
  question: AssessmentQuestion,
  answer: unknown,
): number {
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

export function QuizAnswerReviewDialog({
  assessment,
  attempt,
  isOpen,
  onOpenChange,
}: QuizAnswerReviewDialogProps) {
  const attemptAnswers = (attempt.answers as AttemptAnswers) ?? null;
  const questions = assessment.questions ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{assessment.title} Answers</DialogTitle>
          <DialogDescription>
            Review your submitted answers and scoring details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No questions available for review.
              </p>
            ) : (
              questions
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((question) => {
                  const answer = getAnswer(attemptAnswers, question.id);
                  const storedGrade = getStoredGrade(
                    attemptAnswers,
                    question.id,
                  );
                  const autoPoints = computeAutoPoints(question, answer);
                  const awardedPoints =
                    storedGrade ??
                    (question.type === 'essay' ? null : autoPoints);
                  const hasAnswer =
                    answer !== null &&
                    answer !== undefined &&
                    String(answer).trim() !== '';

                  const isCorrect =
                    question.type === 'multiple_choice'
                      ? isMultipleChoiceConfig(question.answer_config) &&
                        Number(answer) === question.answer_config.correct_index
                      : question.type === 'fill_blank'
                        ? getFillBlankAnswerKey(question).includes(
                            normalizeFillBlank(answer),
                          )
                        : null;

                  const statusBadge = (() => {
                    if (question.type === 'essay') {
                      return storedGrade === null ? (
                        <Badge variant="outline">Needs grading</Badge>
                      ) : (
                        <Badge variant="secondary">Graded</Badge>
                      );
                    }

                    if (!hasAnswer) {
                      return <Badge variant="outline">No answer</Badge>;
                    }

                    return isCorrect ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200">
                        Correct
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                        Incorrect
                      </Badge>
                    );
                  })();

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border bg-white p-4 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold">
                          Q{question.order}: {question.question}
                        </p>
                        {statusBadge}
                      </div>

                      <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>Type: {question.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Points: {question.points}</span>
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
                                {getFillBlankAnswerDisplayList(question).join(
                                  ', ',
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Your answer
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                            {question.type === 'multiple_choice'
                              ? getMultipleChoiceLabel(question, answer) || '—'
                              : String(answer ?? '').trim() || '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            Awarded
                          </p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                            {awardedPoints !== null
                              ? `${awardedPoints} / ${question.points}`
                              : `Pending / ${question.points}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        <DialogFooter className="border-t p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
