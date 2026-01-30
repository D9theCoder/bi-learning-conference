import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { TutorCard } from '@/components/tutors/tutor-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { tutors as tutorsRoute } from '@/routes';
import type { BreadcrumbItem, TutorsPageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Tutors', href: tutorsRoute().url },
];

export default function TutorsPage({ tutors, filters }: TutorsPageProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  const handleFilterChange = useCallback(
    (
      key: keyof TutorsPageProps['filters'],
      value: string | number | undefined,
    ) => {
      router.get(
        tutorsRoute().url,
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

  const hasPagination = useMemo(() => tutors.last_page > 1, [tutors.last_page]);

  const goToPage = (page: number) => {
    router.get(
      tutorsRoute().url,
      { ...filters, page },
      { preserveState: true, replace: true },
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tutors" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={Users}
          title="Tutors"
          description="Connect with your tutors and get help with your learning."
          iconClassName="text-green-500"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tutors..."
              className="pl-3"
            />
          </div>
          {hasPagination && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={tutors.current_page <= 1}
                onClick={() => goToPage(tutors.current_page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {tutors.current_page} of {tutors.last_page}
              </span>
              <Button
                variant="outline"
                disabled={tutors.current_page >= tutors.last_page}
                onClick={() => goToPage(tutors.current_page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.data.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>

        {tutors.data.length === 0 && <EmptyState message="No tutors found." />}
      </div>
    </AppLayout>
  );
}
