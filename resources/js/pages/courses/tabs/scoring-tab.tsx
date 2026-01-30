import { AccessGateWarningCard } from '@/components/courses/shared';
import {
  GradingAssessmentCard,
  MyScoresCard,
  QuizGradingAssessmentCard,
} from '@/components/courses/tabs/scoring';
import { Card, CardContent } from '@/components/ui/card';
import { useRoles } from '@/hooks/use-roles';
import {
  Assessment,
  AssessmentSubmission,
  Course,
  StudentWithSubmissions,
  User,
} from '@/types';
import { router } from '@inertiajs/react';
import { Award } from 'lucide-react';
import { useState } from 'react';

interface ScoringTabProps {
  course: Course & {
    instructor: User;
  };
  isEnrolled: boolean;
  isTutor?: boolean;
  assessments?: Assessment[];
  students?: StudentWithSubmissions[];
  submissions?: AssessmentSubmission[];
}

export function ScoringTab({
  course,
  isEnrolled,
  isTutor = false,
  assessments = [],
  students = [],
  submissions = [],
}: ScoringTabProps) {
  const { isAdmin } = useRoles();
  const canView = isEnrolled || isAdmin || isTutor;

  const [expandedAssessmentId, setExpandedAssessmentId] = useState<
    number | null
  >(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  if (!canView) {
    return (
      <AccessGateWarningCard
        icon={Award}
        title="Scoring Not Available"
        description="Enroll in this course to view your grades and scoring details."
      />
    );
  }

  if (isTutor) {
    if (assessments.length === 0) {
      return (
        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="py-12 text-center text-muted-foreground">
            No assessments available to grade.
          </CardContent>
        </Card>
      );
    }

    const handleSave = (assessmentId: number, studentId: number) => {
      const key = `${assessmentId}-${studentId}`;
      const scoreVal = scores[key];
      const feedbackVal = feedbacks[key];

      if (scoreVal === undefined && feedbackVal === undefined) {
        return;
      }

      router.post(
        `/assessments/${assessmentId}/score`,
        {
          user_id: studentId,
          score: scoreVal,
          feedback: feedbackVal,
        },
        {
          preserveScroll: true,
        },
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Grading Dashboard</h3>
        </div>

        {assessments.map((assessment) => {
          const usesQuestions = ['practice', 'quiz', 'final_exam'].includes(
            assessment.type,
          );

          if (usesQuestions) {
            return (
              <QuizGradingAssessmentCard
                key={assessment.id}
                courseId={course.id}
                assessment={assessment}
                students={students}
                isExpanded={expandedAssessmentId === assessment.id}
                onToggle={() =>
                  setExpandedAssessmentId(
                    expandedAssessmentId === assessment.id
                      ? null
                      : assessment.id,
                  )
                }
              />
            );
          }

          return (
            <GradingAssessmentCard
              key={assessment.id}
              assessment={assessment}
              students={students}
              isExpanded={expandedAssessmentId === assessment.id}
              onToggle={() =>
                setExpandedAssessmentId(
                  expandedAssessmentId === assessment.id ? null : assessment.id,
                )
              }
              scores={scores}
              feedbacks={feedbacks}
              onScoreChange={(key, value) =>
                setScores({ ...scores, [key]: value })
              }
              onFeedbackChange={(key, value) =>
                setFeedbacks({ ...feedbacks, [key]: value })
              }
              onSave={(studentId) => handleSave(assessment.id, studentId)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MyScoresCard assessments={assessments} submissions={submissions} />
    </div>
  );
}
