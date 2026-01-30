import { CourseCard } from '@/components/dashboard/course-card';
import { Card, CardContent } from '@/components/ui/card';
import type { Enrollment } from '@/types';
import { BookOpen } from 'lucide-react';
import { memo } from 'react';

interface DashboardCoursesSectionProps {
  enrolledCourses: Enrollment[];
}

export const DashboardCoursesSection = memo(
  ({ enrolledCourses }: DashboardCoursesSectionProps) => (
    <section aria-labelledby="courses-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          id="courses-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
        >
          <BookOpen className="size-5 text-primary" />
          My Courses
        </h2>
        <span className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          View All
        </span>
      </div>
      {enrolledCourses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2" role="list">
          {enrolledCourses.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BookOpen className="mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No courses yet</h3>
            <p className="text-sm text-muted-foreground">
              Start your learning journey by enrolling in a course! Welcome to
              bi-lear
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  ),
);

DashboardCoursesSection.displayName = 'DashboardCoursesSection';
