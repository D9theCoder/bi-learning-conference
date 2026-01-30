import { Button } from '@/components/ui/button';
import { Assessment, AssessmentSubmission } from '@/types';
import { Link } from '@inertiajs/react';
import {
  CheckCircle,
  Clock,
  FileText,
  PenLine,
  Play,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface AssessmentListItemProps {
  assessment: Assessment;
  submission?: AssessmentSubmission;
  courseId: number;
  isTutor: boolean;
}

export function AssessmentListItem({
  assessment,
  submission,
  courseId,
  isTutor,
}: AssessmentListItemProps) {
  const hasCompleted = submission && submission.score !== null;
  const isPendingReview =
    assessment.type === 'final_exam' && submission && submission.score === null;
  const isPastDue =
    assessment.due_date && new Date(assessment.due_date) < new Date();
  const typeLabel =
    assessment.type === 'practice'
      ? 'Practice'
      : assessment.type === 'final_exam'
        ? 'Final Exam'
        : 'Quiz';
  const actionLabel = hasCompleted
    ? assessment.allow_retakes
      ? `Retake ${typeLabel}`
      : 'View'
    : `Start ${typeLabel}`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {assessment.type === 'final_exam' ? (
            <FileText className="h-4 w-4 text-red-500" />
          ) : assessment.type === 'practice' ? (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-blue-500" />
          )}
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {assessment.title}
          </h4>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {typeLabel}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {assessment.max_score} pts
          </span>
          {assessment.time_limit_minutes && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Clock className="mr-1 inline h-3 w-3" />
              {assessment.time_limit_minutes} min
            </span>
          )}
          {assessment.allow_retakes && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <RefreshCw className="mr-1 inline h-3 w-3" />
              Retakes allowed
            </span>
          )}
          {!assessment.is_published && isTutor && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              Draft
            </span>
          )}
        </div>
        {assessment.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {assessment.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {assessment.due_date && (
            <span
              className={`flex items-center gap-1 ${isPastDue && !hasCompleted ? 'text-red-500' : ''}`}
            >
              <Clock className="h-3 w-3" />
              Due: {new Date(assessment.due_date).toLocaleDateString()}
              {isPastDue && !hasCompleted && ' (Past due)'}
            </span>
          )}
          {hasCompleted && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Trophy className="h-3 w-3" />
              Score: {submission.score} / {assessment.max_score}
            </span>
          )}
          {isPendingReview && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Trophy className="h-3 w-3" />
              Pending review
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isTutor ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${courseId}/quiz/${assessment.id}/edit`}>
              <PenLine className="mr-2 h-4 w-4" />
              Edit Assessment
            </Link>
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link href={`/courses/${courseId}/quiz/${assessment.id}`}>
              <Play className="mr-2 h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
