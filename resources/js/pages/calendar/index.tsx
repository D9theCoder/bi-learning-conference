import { CalendarOverviewCard } from '@/components/calendar/calendar-overview-card';
import { CalendarTaskList } from '@/components/calendar/calendar-task-list';
import { MiniCalendar } from '@/components/calendar/mini-calendar';
import { AdminCourseListSection } from '@/components/calendar/admin-course-list-section';
import { PageHeader } from '@/components/shared/page-header';
import { useRoles } from '@/hooks/use-roles';
import AppLayout from '@/layouts/app-layout';
import {
  formatActiveDateLabel,
  formatDateKey,
  parseDateKey,
} from '@/lib/calendar-utils';
import { calendar as calendarRoute } from '@/routes';
import type { BreadcrumbItem, CalendarPageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Calendar', href: calendarRoute().url },
];

export default function CalendarPage() {
  const {
    tasksByDate,
    stats,
    currentDate: currentDateString,
    courses,
    courseMarkers,
  } = usePage<CalendarPageProps>().props;
  const { isAdmin } = useRoles();

  const initialDate = useMemo(
    () => parseDateKey(currentDateString),
    [currentDateString],
  );
  const [filterDate, setFilterDate] = useState<string | null>(null);

  const dates = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate]);
  const markers = useMemo(() => {
    const merged = new Set([
      ...Object.keys(tasksByDate),
      ...(courseMarkers ?? []),
    ]);
    return Array.from(merged);
  }, [courseMarkers, tasksByDate]);

  const filteredDates = useMemo(() => {
    if (!filterDate) return dates;
    return tasksByDate[filterDate] ? [filterDate] : [];
  }, [dates, filterDate, tasksByDate]);

  const selectedDate = useMemo(
    () => (filterDate ? new Date(filterDate) : initialDate),
    [filterDate, initialDate],
  );

  const handleDateSelect = (date: Date) => setFilterDate(formatDateKey(date));
  const handleResetFilter = () => setFilterDate(null);

  const isFiltered = Boolean(filterDate);
  const activeDateLabel = formatActiveDateLabel(filterDate, tasksByDate);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Calendar" />

      <div className="container mx-auto px-4 py-4 lg:px-6">
        <PageHeader
          icon={Calendar}
          title="Calendar"
          description="Track your meetings, assessments, and tasks. Stay on top of your learning schedule."
          className="mb-6 lg:mb-8"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 lg:space-y-6">
            <MiniCalendar
              currentDate={selectedDate}
              tasksByDate={tasksByDate}
              markers={markers}
              courseMarkers={courseMarkers}
              onDateSelect={handleDateSelect}
              onResetFilter={handleResetFilter}
              isFiltered={isFiltered}
              className="w-full"
            />
            <CalendarOverviewCard stats={stats} />
            {isAdmin && courses && (
              <AdminCourseListSection courses={courses} />
            )}
          </div>

          <CalendarTaskList
            isFiltered={isFiltered}
            activeDateLabel={activeDateLabel}
            filteredDates={filteredDates}
            tasksByDate={tasksByDate}
            showCourseLegend={Boolean(courseMarkers?.length)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
