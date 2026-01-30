import { CourseDetailsForm, LessonsSection } from '@/components/courses/manage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { EditCoursePageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditCourse({
  course,
  mode,
  categories,
  availablePowerups = [],
  availableTutors = [],
  isAdmin = false,
}: EditCoursePageProps) {
  const isEdit = mode === 'edit';
  const form = useForm({
    title: course?.title ?? '',
    description: course?.description ?? '',
    category: course?.category ?? '',
    difficulty: course?.difficulty ?? '',
    duration_minutes: course?.duration_minutes ?? '',
    thumbnail: course?.thumbnail ?? '',
    is_published: course?.is_published ?? false,
    instructor_id: course?.instructor_id ?? '',
  });

  const submitCourse = () => {
    if (isEdit && course) {
      form.put(`/courses/manage/${course.id}`, {
        preserveScroll: true,
        onSuccess: () => toast.success('Course saved successfully!'),
      });
    } else {
      form.post('/courses/manage', {
        preserveScroll: true,
        onSuccess: () => toast.success('Course saved successfully!'),
      });
    }
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Courses', href: '/courses/manage' },
        { title: isEdit ? 'Edit Course' : 'Create Course', href: '#' },
      ]}
    >
      <Head title={isEdit ? 'Edit Course' : 'Create Course'} />

      <div className="flex flex-col gap-6 p-4 lg:p-8">
        <div className="flex items-center gap-3">
          <Link href="/courses/manage">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {isEdit ? 'Update course' : 'New course'}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? `Edit ${course?.title}` : 'Create a course'}
            </h1>
          </div>
        </div>

        <CourseDetailsForm
          form={form}
          categories={categories}
          isEdit={isEdit}
          onSubmit={submitCourse}
          availableTutors={availableTutors}
          isAdmin={isAdmin}
        />

        {isEdit && course ? (
          <LessonsSection
            courseId={course.id}
            lessons={course.lessons ?? []}
            availablePowerups={availablePowerups}
          />
        ) : isEdit ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Lessons & content
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Save the course first to manage lessons and content.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
