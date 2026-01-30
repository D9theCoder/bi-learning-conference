import { AccessGateWarningCard } from '@/components/courses/shared';
import {
  GradebookStudentGrid,
  GradebookTutorMatrix,
} from '@/components/courses/tabs/gradebook';
import { useRoles } from '@/hooks/use-roles';
import {
  Assessment,
  AssessmentSubmission,
  Course,
  StudentWithSubmissions,
  User,
} from '@/types';
import { BookCheck } from 'lucide-react';

interface GradebookTabProps {
  course: Course & {
    instructor: User;
  };
  isEnrolled: boolean;
  isTutor?: boolean;
  students?: StudentWithSubmissions[];
  assessments?: Assessment[];
  submissions?: AssessmentSubmission[];
}

export function GradebookTab({
  isEnrolled,
  isTutor = false,
  students = [],
  assessments = [],
  submissions = [],
}: GradebookTabProps) {
  const { isAdmin } = useRoles();
  const canView = isEnrolled || isAdmin || isTutor;
  const finalExam = assessments.find(
    (assessment) => assessment.type === 'final_exam',
  );
  const finalExamWeight = finalExam?.weight_percentage ?? null;
  const quizAssessments = assessments.filter(
    (assessment) => assessment.type === 'quiz',
  );
  const quizWeight =
    finalExamWeight !== null
      ? Math.max(0, 100 - finalExamWeight)
      : quizAssessments.length > 0
        ? 100
        : 0;

  const distributionCard =
    assessments.length > 0 ? (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
        <p className="font-medium text-foreground">Score Distribution</p>
        <div className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
          <span>
            Final Exam:{' '}
            {finalExam
              ? finalExamWeight !== null
                ? `${finalExamWeight}%`
                : 'Not set'
              : 'No final exam'}
          </span>
          <span>
            Quizzes:{' '}
            {finalExam
              ? finalExamWeight !== null
                ? `${quizWeight}%`
                : 'Not set'
              : '100%'}
          </span>
        </div>
      </div>
    ) : null;

  if (!canView) {
    return (
      <AccessGateWarningCard
        icon={BookCheck}
        title="Gradebook Not Available"
        description="Enroll in this course to view your gradebook."
      />
    );
  }

  // tutor view
  if (isTutor) {
    return (
      <div className="space-y-4">
        {distributionCard}
        <GradebookTutorMatrix students={students} assessments={assessments} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {distributionCard}
      <GradebookStudentGrid
        assessments={assessments}
        submissions={submissions}
      />
    </div>
  );
}
