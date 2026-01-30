import type { AnswerConfig } from '@/types';
import { Clock } from 'lucide-react';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  answer_config: AnswerConfig;
  points: number;
  order: number;
}

interface QuizTakeSidebarProps {
  questions: QuizQuestion[];
  answers: Record<number, string>;
  currentIndex: number;
  remainingTime: number | null;
  isSaving: boolean;
  onQuestionSelect: (index: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QuizTakeSidebar({
  questions,
  answers,
  currentIndex,
  remainingTime,
  isSaving,
  onQuestionSelect,
}: QuizTakeSidebarProps) {
  const answeredCount = Object.keys(answers).filter(
    (key) =>
      answers[parseInt(key)] !== '' && answers[parseInt(key)] !== undefined,
  ).length;

  return (
    <div className="border-b bg-muted/30 p-4 lg:w-64 lg:border-r lg:border-b-0">
      {/* Timer */}
      {remainingTime !== null && (
        <div
          className={`mb-4 rounded-lg p-3 ${
            remainingTime < 300
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className={`h-5 w-5 ${
                remainingTime < 300
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            />
            <span
              className={`text-lg font-bold ${
                remainingTime < 300
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}
            >
              {formatTime(remainingTime)}
            </span>
          </div>
          <p
            className={`text-xs ${
              remainingTime < 300
                ? 'text-red-600 dark:text-red-500'
                : 'text-blue-600 dark:text-blue-500'
            }`}
          >
            {remainingTime < 300 ? 'Time is running out!' : 'Time remaining'}
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {answeredCount} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-1 lg:grid-cols-4">
        {questions.map((q, idx) => {
          const isAnswered =
            answers[q.id] !== undefined && answers[q.id] !== '';
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onQuestionSelect(idx)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-yellow-500 text-white'
                  : isAnswered
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-yellow-500" />
          <span className="text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-100 dark:bg-green-900/20" />
          <span className="text-muted-foreground">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-muted" />
          <span className="text-muted-foreground">Not answered</span>
        </div>
      </div>

      {/* Save indicator */}
      {isSaving && (
        <p className="mt-4 text-xs text-muted-foreground">Saving...</p>
      )}
    </div>
  );
}
