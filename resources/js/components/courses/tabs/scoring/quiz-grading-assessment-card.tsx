import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Assessment, AssessmentAttempt } from '@/types';
import { router } from '@inertiajs/react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { QuizGradingStudentRow } from './quiz-grading-student-row';

type StudentForQuizGrading = {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  assessment_attempts?: AssessmentAttempt[];
  [key: string]: unknown;
};

interface QuizGradingAssessmentCardProps {
  courseId: number;
  assessment: Assessment;
  students: StudentForQuizGrading[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function QuizGradingAssessmentCard({
  courseId,
  assessment,
  students,
  isExpanded,
  onToggle,
}: QuizGradingAssessmentCardProps) {
  const [grades, setGrades] = useState<Record<string, string>>({});

  const questions = useMemo(
    () => assessment.questions ?? [],
    [assessment.questions],
  );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div
        className="flex cursor-pointer items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-blue-500" />
          <div>
            <h4 className="text-lg font-medium">{assessment.title}</h4>
            <p className="text-sm text-gray-500">
              {assessment.type === 'final_exam'
                ? 'Final Exam'
                : assessment.type === 'practice'
                  ? 'Practice'
                  : 'Quiz'}{' '}
              • Max Score: {assessment.max_score} • Due:{' '}
              {assessment.due_date
                ? new Date(assessment.due_date).toLocaleDateString()
                : 'No due date'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50/50 p-6 dark:bg-gray-900/20">
          <div className="space-y-4">
            {students.length > 0 ? (
              students.map((student) => {
                const attempts =
                  student.assessment_attempts?.filter(
                    (attempt) => attempt.assessment_id === assessment.id,
                  ) ?? [];

                if (attempts.length === 0) {
                  return (
                    <div
                      key={student.id}
                      className="rounded-lg border bg-white p-4 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {student.name}
                      </span>{' '}
                      — No attempts yet.
                    </div>
                  );
                }

                const sortedAttempts = attempts
                  .slice()
                  .sort((a, b) => {
                    const aTime = a.completed_at ?? a.created_at;
                    const bTime = b.completed_at ?? b.created_at;
                    return new Date(bTime).getTime() - new Date(aTime).getTime();
                  });

                return (
                  <div key={student.id} className="space-y-3">
                    {sortedAttempts.map((attempt) => (
                      <QuizGradingStudentRow
                        key={attempt.id}
                        student={student}
                        assessment={assessment}
                        attempt={attempt}
                        questions={questions}
                        grades={grades}
                        onGradeChange={(key, value) =>
                          setGrades((prev) => ({ ...prev, [key]: value }))
                        }
                        onSave={(payload, options) => {
                          router.post(
                            `/courses/${courseId}/quiz/${assessment.id}/attempts/${attempt.id}/grade-essay`,
                            { grades: payload },
                            {
                              preserveScroll: true,
                              onSuccess: () => options.onSuccess(),
                              onError: () => options.onError?.(),
                              onFinish: () => options.onFinish?.(),
                            },
                          );
                        }}
                      />
                    ))}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500">No students enrolled.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
