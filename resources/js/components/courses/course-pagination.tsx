import { Button } from '@/components/ui/button';
import { courses as coursesRoute } from '@/routes';
import { router } from '@inertiajs/react';

interface CoursePaginationProps {
  currentPage: number;
  lastPage: number;
  filters: Record<string, string>;
  searchTerm: string;
}

export function CoursePagination({
  currentPage,
  lastPage,
  filters,
  searchTerm,
}: CoursePaginationProps) {
  if (lastPage <= 1) return null;

  const handlePageChange = (page: number) => {
    const params: Record<string, string> = {
      ...filters,
      page: page.toString(),
    };

    const term = searchTerm.trim();
    if (term) {
      params.search = term;
    } else {
      delete params.search;
    }

    router.get(coursesRoute().url, params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Button>
      ))}
    </div>
  );
}
