import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminCalendarCourse } from '@/types';
import { Link } from '@inertiajs/react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
  Users,
} from 'lucide-react';
import { memo } from 'react';

interface AdminCourseListSectionProps {
  courses: {
    data: AdminCalendarCourse[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
}

export const AdminCourseListSection = memo(
  ({ courses }: AdminCourseListSectionProps) => (
    <section aria-labelledby="admin-courses-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="admin-courses-heading"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
          >
            <BookOpen className="size-5 text-primary" />
            All courses
          </h2>
          <p className="text-xs text-muted-foreground">
            Total: {courses.total} · Page {courses.current_page} of{' '}
            {courses.last_page}
          </p>
        </div>
        <Link
          href="/courses/manage"
          prefetch
          className="text-sm font-semibold text-primary transition hover:opacity-80"
        >
          Manage courses
        </Link>
      </div>

      {courses.data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No courses available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.data.map((course) => (
            <Card
              noPadding
              key={course.id}
              className="group relative overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex flex-1 flex-col justify-center gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold break-words text-foreground">
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
                    <GraduationCap className="size-3.5" />
                    <span>{course.instructor?.name ?? 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    <span>{course.student_count} students</span>
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

      {courses.links && courses.last_page > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Showing {courses.data.length} of {courses.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 pt-0">
            {courses.links.map((link, index) =>
              link.url ? (
                <Link
                  key={index}
                  href={link.url}
                  preserveScroll
                  className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-3 text-xs ${
                    link.active
                      ? 'bg-primary text-primary-foreground'
                      : 'border-transparent hover:bg-muted'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ) : (
                <span
                  key={index}
                  className="flex h-8 min-w-8 items-center justify-center px-3 text-xs text-muted-foreground opacity-50"
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ),
            )}
          </CardContent>
        </Card>
      )}
    </section>
  ),
);

AdminCourseListSection.displayName = 'AdminCourseListSection';
