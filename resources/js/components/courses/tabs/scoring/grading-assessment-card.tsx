import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Assessment, StudentWithSubmissions } from '@/types';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { GradingStudentRow } from './grading-student-row';

interface GradingAssessmentCardProps {
  assessment: Assessment;
  students: StudentWithSubmissions[];
  isExpanded: boolean;
  onToggle: () => void;
  scores: Record<string, string>;
  feedbacks: Record<string, string>;
  onScoreChange: (key: string, value: string) => void;
  onFeedbackChange: (key: string, value: string) => void;
  onSave: (studentId: number) => void;
}

export function GradingAssessmentCard({
  assessment,
  students,
  isExpanded,
  onToggle,
  scores,
  feedbacks,
  onScoreChange,
  onFeedbackChange,
  onSave,
}: GradingAssessmentCardProps) {
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
              Max Score: {assessment.max_score} • Due:{' '}
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
                const submission = student.submissions?.find(
                  (s) => s.assessment_id === assessment.id,
                );
                const key = `${assessment.id}-${student.id}`;
                const currentScore = scores[key] ?? submission?.score ?? '';
                const currentFeedback =
                  feedbacks[key] ?? submission?.feedback ?? '';

                return (
                  <GradingStudentRow
                    key={student.id}
                    student={student}
                    assessment={assessment}
                    currentScore={currentScore}
                    currentFeedback={currentFeedback}
                    onScoreChange={(value) => onScoreChange(key, value)}
                    onFeedbackChange={(value) => onFeedbackChange(key, value)}
                    onSave={() => onSave(student.id)}
                  />
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
