import { Card, CardContent } from '@/components/ui/card';
import { Assessment, AssessmentSubmission } from '@/types';
import { BookCheck } from 'lucide-react';

interface GradebookStudentGridProps {
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
}

export function GradebookStudentGrid({
  assessments,
  submissions,
}: GradebookStudentGridProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <BookCheck className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">My Gradebook</h3>
        </div>

        {assessments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => {
              const submission = submissions.find(
                (s) => s.assessment_id === assessment.id,
              );
              const score = submission?.score ?? 0;
              const percentage = Math.round(
                (score / assessment.max_score) * 100,
              );

              return (
                <div
                  key={assessment.id}
                  className="rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4
                      className="truncate pr-2 font-medium"
                      title={assessment.title}
                    >
                      {assessment.title}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {assessment.max_score} pts
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">
                      {submission ? score : '-'}
                    </span>
                    <span className="mb-1 text-sm text-gray-500">
                      {submission ? `${percentage}%` : 'Pending'}
                    </span>
                  </div>
                  {submission?.feedback && (
                    <div className="mt-3 rounded bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {submission.feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No grades available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
