import { DashedEmptyState } from '@/components/courses/shared';
import {
  AssessmentListItem,
  AssessmentsHeader,
} from '@/components/courses/tabs/assessment';
import { Card, CardContent } from '@/components/ui/card';
import { Assessment, AssessmentSubmission, Course, User } from '@/types';
import { router } from '@inertiajs/react';

interface AssessmentTabProps {
  course: Course & {
    instructor: User;
  };
  assessments?: Assessment[];
  submissions?: AssessmentSubmission[];
  isTutor?: boolean;
}

export function AssessmentTab({
  course,
  assessments = [],
  submissions = [],
  isTutor = false,
}: AssessmentTabProps) {
  const getSubmissionForAssessment = (assessmentId: number) => {
    return submissions.find((s) => s.assessment_id === assessmentId);
  };

  const handleCreateQuiz = () => {
    router.post(`/courses/${course.id}/quiz`, {
      type: 'quiz',
      title: 'New Quiz',
      description: '',
      max_score: 100,
    });
  };

  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <AssessmentsHeader
            isTutor={isTutor}
            onCreateQuiz={handleCreateQuiz}
            description="Assessment details will be posted when available."
          />
          <CardContent className="space-y-3">
            <DashedEmptyState message="No assessments have been published for this course yet." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <AssessmentsHeader
          isTutor={isTutor}
          onCreateQuiz={handleCreateQuiz}
          description="Complete the following assessments."
        />
        <CardContent className="space-y-3">
          {assessments.map((assessment) => (
            <AssessmentListItem
              key={assessment.id}
              assessment={assessment}
              submission={getSubmissionForAssessment(assessment.id)}
              courseId={course.id}
              isTutor={isTutor}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
