import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StudentCard } from '@/components/students/student-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, StudentsPageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Students', href: '/students' },
];

export default function StudentsPage({ students, filters }: StudentsPageProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  const handleFilterChange = useCallback(
    (
      key: keyof StudentsPageProps['filters'],
      value: string | number | undefined,
    ) => {
      router.get(
        '/students',
        { ...filters, [key]: value, page: 1 },
        { preserveState: true, replace: true },
      );
    },
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search ?? '')) {
        handleFilterChange('search', searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search, handleFilterChange, searchTerm]);

  const hasPagination = useMemo(
    () => students.last_page > 1,
    [students.last_page],
  );

  const goToPage = (page: number) => {
    router.get(
      '/students',
      { ...filters, page },
      { preserveState: true, replace: true },
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Students" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={GraduationCap}
          title="Students"
          description="View and connect with students enrolled in your courses."
          iconClassName="text-blue-500"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search students..."
              className="pl-3"
            />
          </div>
          {hasPagination && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={students.current_page <= 1}
                onClick={() => goToPage(students.current_page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {students.current_page} of {students.last_page}
              </span>
              <Button
                variant="outline"
                disabled={students.current_page >= students.last_page}
                onClick={() => goToPage(students.current_page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.data.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>

        {students.data.length === 0 && (
          <EmptyState message="No students found." />
        )}
      </div>
    </AppLayout>
  );
}
