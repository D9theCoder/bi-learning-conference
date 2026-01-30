import { ManageCourseRow } from '@/components/courses/manage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useRoles } from '@/hooks/use-roles';
import AppLayout from '@/layouts/app-layout';
import { ManageCoursesPageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ManageCourses({
  courses,
  filters,
}: ManageCoursesPageProps) {
  const { isAdmin } = useRoles();
  const [search, setSearch] = useState(filters?.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters?.search || '')) {
        router.get(
          '/courses/manage',
          { search },
          { preserveState: true, replace: true, preserveScroll: true },
        );
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [search, filters?.search]);

  return (
    <AppLayout breadcrumbs={[{ title: 'Courses', href: '/courses/manage' }]}>
      <Head title="Manage Courses" />

      <div className="flex flex-col gap-6 p-4 lg:p-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Admin / Tutor
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Manage Courses
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and maintain courses. Tutors only see their own courses;
              admins see everything.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            {isAdmin && (
              <Link href="/courses/manage/create">
                <Button className="inline-flex items-center gap-2">
                  <Plus className="size-4" />
                  New Course
                </Button>
              </Link>
            )}
          </div>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Courses
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Total: {courses.total} | Page {courses.current_page} of{' '}
              {courses.last_page}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {courses.data.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {isAdmin ? 'No courses yet' : 'No courses assigned'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin
                      ? 'Create your first course to get started.'
                      : 'Courses assigned to you by an admin will appear here.'}
                  </p>
                  {isAdmin && (
                    <Link href="/courses/manage/create">
                      <Button size="sm">Create course</Button>
                    </Link>
                  )}
                </div>
              )}

              {courses.data.map((course) => (
                <ManageCourseRow key={course.id} course={course} />
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between px-6 pt-4 text-xs text-muted-foreground">
              <span>
                Showing {courses.data.length} of {courses.total}
              </span>
              <div className="flex items-center gap-1">
                {courses.links.map((link, i) =>
                  link.url ? (
                    <Link
                      key={i}
                      href={link.url}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-3 ${
                        link.active
                          ? 'bg-primary text-primary-foreground'
                          : 'border-transparent hover:bg-muted'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ) : (
                    <span
                      key={i}
                      className="flex h-8 min-w-8 items-center justify-center px-3 text-muted-foreground opacity-50"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ),
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
