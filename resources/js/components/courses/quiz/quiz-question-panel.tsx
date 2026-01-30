import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ListOrdered,
  PenLine,
  Send,
} from 'lucide-react';
import type { AnswerConfig } from '@/types';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  answer_config: AnswerConfig;
  points: number;
  order: number;
}

interface QuizQuestionPanelProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  answer: string | undefined;
  hiddenOptionIndexes?: number[];
  onAnswerChange: (questionId: number, value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function getQuestionIcon(type: string) {
  switch (type) {
    case 'multiple_choice':
      return <ListOrdered className="h-4 w-4" />;
    case 'fill_blank':
      return <PenLine className="h-4 w-4" />;
    case 'essay':
      return <FileText className="h-4 w-4" />;
    default:
      return null;
  }
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'fill_blank':
      return 'Fill in the Blank';
    case 'essay':
      return 'Essay';
    default:
      return type;
  }
}

export function QuizQuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  answer,
  hiddenOptionIndexes,
  onAnswerChange,
  onPrevious,
  onNext,
  onSubmit,
}: QuizQuestionPanelProps) {
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const hiddenOptions = new Set(hiddenOptionIndexes ?? []);
  const multipleChoiceOptions =
    question.answer_config.type === 'multiple_choice'
      ? question.answer_config.options ?? []
      : [];

  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent className="pt-6">
        {/* Question Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-sm font-bold text-white">
              {questionIndex + 1}
            </span>
            <span className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
              {getQuestionIcon(question.type)}
              {getQuestionTypeLabel(question.type)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {question.points} point{question.points > 1 ? 's' : ''}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-lg whitespace-pre-wrap">{question.question}</p>
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          {question.type === 'multiple_choice' &&
            question.answer_config.type === 'multiple_choice' && (
            <div className="space-y-2">
              {multipleChoiceOptions.map((option, idx) => {
                if (hiddenOptions.has(idx)) {
                  return null;
                }

                return (
                  <label
                    key={idx}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      answer === String(idx)
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answer === String(idx)}
                      onChange={() => onAnswerChange(question.id, String(idx))}
                      className="h-4 w-4 accent-yellow-500"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'fill_blank' && (
            <Input
              value={answer ?? ''}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              className="text-lg"
            />
          )}

          {question.type === 'essay' && (
            <Textarea
              value={answer ?? ''}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Write your essay answer here..."
              rows={8}
              className="text-base"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {isLastQuestion ? (
              <Button
                onClick={onSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={onNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
