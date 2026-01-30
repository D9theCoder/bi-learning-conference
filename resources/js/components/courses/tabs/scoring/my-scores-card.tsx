import { QuizAnswerReviewDialog } from '@/components/courses/quiz/quiz-answer-review-dialog';
import { DashedEmptyState } from '@/components/courses/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Assessment, AssessmentAttempt, AssessmentSubmission } from '@/types';
import { useState } from 'react';

interface MyScoresCardProps {
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
}

export function MyScoresCard({ assessments, submissions }: MyScoresCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState<{
    assessment: Assessment;
    attempt: AssessmentAttempt;
  } | null>(null);

  const handleOpenReview = (
    assessment: Assessment,
    attempt: AssessmentAttempt,
  ) => {
    setReviewAttempt({ assessment, attempt });
    setIsOpen(true);
  };

  return (
    <Card className="overflow-hidden py-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          My Scores
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Performance on assessments and quizzes.
        </p>
      </CardHeader>
      <CardContent>
        {assessments.length > 0 ? (
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const submission = submissions.find(
                (s) => s.assessment_id === assessment.id,
              );
              const attempt = submission?.attempt ?? null;
              const isPendingReview =
                assessment.type === 'final_exam' &&
                submission &&
                submission.score === null;
              const canViewAnswers =
                submission &&
                attempt &&
                ['practice', 'quiz'].includes(assessment.type);
              return (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                >
                  <div>
                    <h4 className="font-medium">{assessment.title}</h4>
                    <p className="text-xs text-gray-500">
                      Due:{' '}
                      {assessment.due_date
                        ? new Date(assessment.due_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    {submission ? (
                      <div>
                        {isPendingReview ? (
                          <Badge variant="outline">Pending review</Badge>
                        ) : (
                          <span className="block text-xl font-bold">
                            {submission.score ?? '-'}
                            <span className="text-sm font-normal text-gray-500">
                              /{assessment.max_score}
                            </span>
                          </span>
                        )}
                        {submission.feedback && (
                          <p
                            className="mt-1 max-w-[200px] truncate text-xs text-blue-500"
                            title={submission.feedback}
                          >
                            "{submission.feedback}"
                          </p>
                        )}
                        {canViewAnswers && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() =>
                              handleOpenReview(assessment, attempt)
                            }
                          >
                            View Answers
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DashedEmptyState message="No assessments published yet." />
        )}
      </CardContent>
      {reviewAttempt && (
        <QuizAnswerReviewDialog
          assessment={reviewAttempt.assessment}
          attempt={reviewAttempt.attempt}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      )}
    </Card>
  );
}
