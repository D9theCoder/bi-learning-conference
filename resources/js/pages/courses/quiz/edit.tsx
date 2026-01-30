import {
  QuestionsSection,
  QuizBuilderHeader,
  QuizSettingsCard,
} from '@/components/courses/quiz';
import AppLayout from '@/layouts/app-layout';
import type { Assessment, AssessmentQuestion, Course, Powerup } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface QuizEditProps {
  course: Course;
  assessment: Assessment & { questions: AssessmentQuestion[] };
  availablePowerups: Powerup[];
  lessons: Array<{ id: number; title: string; order: number | null }>;
}

export default function QuizEdit({
  course,
  assessment,
  availablePowerups,
  lessons,
}: QuizEditProps) {
  const initialPowerups =
    assessment.powerups?.map((powerup) => ({
      id: powerup.id,
      limit: powerup.limit ?? powerup.default_limit ?? 1,
    })) ?? [];

  const settingsForm = useForm<{
    type: 'practice' | 'quiz' | 'final_exam';
    title: string;
    description: string;
    lesson_id: number | '' | string;
    due_date: string;
    max_score: number;
    weight_percentage: number | '';
    allow_retakes: boolean;
    time_limit_minutes: number | '' | string;
    is_published: boolean;
    powerups: Array<{ id: number; limit: number }>;
  }>({
    type: assessment.type ?? 'quiz',
    title: assessment.title ?? '',
    description: assessment.description ?? '',
    lesson_id: assessment.lesson_id ?? '',
    due_date: assessment.due_date
      ? new Date(assessment.due_date).toISOString().slice(0, 16)
      : '',
    max_score: assessment.max_score ?? 100,
    weight_percentage: assessment.weight_percentage
      ? Number(assessment.weight_percentage)
      : '',
    allow_retakes: assessment.allow_retakes ?? false,
    time_limit_minutes: assessment.time_limit_minutes ?? '',
    is_published: assessment.is_published ?? false,
    powerups: initialPowerups,
  });

  const saveSettings = () => {
    settingsForm.put(`/courses/${course.id}/quiz/${assessment.id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Assessment updated successfully!'),
    });
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Courses', href: '/courses' },
        { title: course.title, href: `/courses/${course.id}` },
        { title: 'Assessment Builder', href: '#' },
      ]}
    >
      <Head title={`Edit Assessment - ${assessment.title}`} />

      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <QuizBuilderHeader
          courseId={course.id}
          courseTitle={course.title}
          assessmentTitle={assessment.title}
          isPublished={assessment.is_published ?? false}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <QuizSettingsCard
              form={settingsForm}
              assessment={assessment}
              availablePowerups={availablePowerups}
              lessons={lessons}
              onSave={saveSettings}
            />
          </div>

          <div className="lg:col-span-2">
            <QuestionsSection
              questions={assessment.questions ?? []}
              courseId={course.id}
              assessmentId={assessment.id}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
