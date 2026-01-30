import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Assessment, AssessmentQuestion } from '@/types';
import {
  Clock,
  FileText,
  HelpCircle,
  ListOrdered,
  PenLine,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface QuizInfoCardProps {
  assessment: Assessment & { questions: AssessmentQuestion[] };
}

export function QuizInfoCard({ assessment }: QuizInfoCardProps) {
  const getQuestionTypeCount = () => {
    const counts = {
      multiple_choice: 0,
      fill_blank: 0,
      essay: 0,
    };
    assessment.questions?.forEach((q) => {
      counts[q.type]++;
    });
    return counts;
  };

  const questionCounts = getQuestionTypeCount();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.description && (
          <div>
            <h4 className="mb-2 font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">
              {assessment.description}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              Questions
            </div>
            <p className="mt-1 text-2xl font-bold">
              {assessment.questions?.length ?? 0}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Max Score
            </div>
            <p className="mt-1 text-2xl font-bold">{assessment.max_score}</p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Time Limit
            </div>
            <p className="mt-1 text-2xl font-bold">
              {assessment.time_limit_minutes
                ? `${assessment.time_limit_minutes} min`
                : 'None'}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              Retakes
            </div>
            <p className="mt-1 text-2xl font-bold">
              {assessment.allow_retakes ? 'Allowed' : 'No'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-medium">Question Types</h4>
          <div className="flex flex-wrap gap-2">
            {questionCounts.multiple_choice > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                <ListOrdered className="h-4 w-4" />
                {questionCounts.multiple_choice} Multiple Choice
              </span>
            )}
            {questionCounts.fill_blank > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <PenLine className="h-4 w-4" />
                {questionCounts.fill_blank} Fill in the Blank
              </span>
            )}
            {questionCounts.essay > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                <FileText className="h-4 w-4" />
                {questionCounts.essay} Essay
              </span>
            )}
          </div>
        </div>

        {assessment.due_date && (
          <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/10">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-500">
              <Clock className="h-4 w-4" />
              Due Date
            </div>
            <p className="mt-1 text-yellow-700 dark:text-yellow-400">
              {new Date(assessment.due_date).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
