import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TutorDashboardData } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { memo } from 'react';

interface TutorCourseListSectionProps {
  courses: TutorDashboardData['courses'];
}

export const TutorCourseListSection = memo(
  ({ courses }: TutorCourseListSectionProps) => (
    <section aria-labelledby="tutor-courses-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          id="tutor-courses-heading"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
        >
          <BookOpen className="size-5 text-primary" />
          Courses you teach
        </h2>
        <Link
          href="/courses/manage"
          prefetch
          className="text-sm font-semibold text-primary transition hover:opacity-80"
        >
          Manage courses
        </Link>
      </div>
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No courses yet. Create your first course to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <Card
              noPadding
              key={course.id}
              className="group relative overflow-hidden"
            >
              <CardContent className="flex gap-4 p-0">
                {/* Course Thumbnail */}
                <div className="relative size-32 shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <BookOpen className="size-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex flex-1 flex-col justify-center gap-2 py-3 pr-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                      {course.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        course.is_published
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    <span>
                      {course.student_count} students · {course.active_students}{' '}
                      active
                    </span>
                  </div>

                  {course.next_meeting_date && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        <span>{course.next_meeting_date}</span>
                      </div>
                      {course.next_meeting_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>{course.next_meeting_time}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Hover Actions */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-end bg-gradient-to-l from-background/95 via-background/70 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="pointer-events-auto translate-y-2 shadow-lg transition-transform duration-300 group-hover:translate-y-0"
                  >
                    <Link href={`/courses/${course.id}`} prefetch>
                      View course
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="pointer-events-auto translate-y-2 shadow-lg transition-transform duration-300 group-hover:translate-y-0"
                  >
                    <Link href={`/courses/manage/${course.id}/edit`} prefetch>
                      Manage course
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  ),
);

TutorCourseListSection.displayName = 'TutorCourseListSection';
