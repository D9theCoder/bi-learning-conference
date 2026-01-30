import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CalendarTask } from '@/types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface MiniCalendarProps {
  className?: string;
  currentDate?: Date;
  tasksByDate?: Record<string, CalendarTask[]>;
  markers?: string[]; // Array of 'YYYY-MM-DD' strings that have events
  courseMarkers?: string[]; // Array of 'YYYY-MM-DD' strings that have course events
  onDateSelect?: (date: Date) => void;
  onResetFilter?: () => void;
  isFiltered?: boolean;
}

export function MiniCalendar({
  className,
  currentDate = new Date(),
  tasksByDate = {},
  markers = [],
  courseMarkers = [],
  onDateSelect,
  onResetFilter,
  isFiltered = false,
}: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  useEffect(() => {
    setViewDate(currentDate);
  }, [currentDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const { days, monthName } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding (to fill 6 rows of 7 = 42)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    const monthName = new Date(year, month).toLocaleString('default', {
      month: 'long',
    });

    return { days, monthName };
  }, [year, month]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const hasMarker = (date: Date) => {
    const dateStr = getDateKey(date);
    return markers.includes(dateStr);
  };

  const getDateCategories = (date: Date): CalendarTask['category'][] => {
    const dateStr = getDateKey(date);
    const tasks = tasksByDate[dateStr] || [];
    const categories = new Set(tasks.map((t) => t.category));
    if (courseMarkers.includes(dateStr)) {
      categories.add('course');
    }
    return Array.from(categories) as CalendarTask['category'][];
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              {monthName} {year}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isFiltered && onResetFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onResetFilter}
              >
                Show all
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((dayObj, index) => {
            const isSelected = isSameDay(dayObj.date, currentDate);
            const isToday = isSameDay(dayObj.date, new Date());
            const hasEvent = hasMarker(dayObj.date);
            const categories = getDateCategories(dayObj.date);

            return (
              <button
                key={index}
                onClick={() => onDateSelect?.(dayObj.date)}
                className={cn(
                  'relative flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  !dayObj.isCurrentMonth &&
                    'text-muted-foreground/50 opacity-50',
                  isSelected &&
                    'bg-primary font-medium text-primary-foreground hover:bg-primary/90',
                  !isSelected &&
                    isToday &&
                    'bg-muted font-medium text-foreground',
                  !isSelected && !isToday && hasEvent && 'font-medium',
                )}
              >
                {dayObj.date.getDate()}
                {hasEvent && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {categories.includes('meeting') && (
                      <div
                        className={cn(
                          'size-1 rounded-full bg-blue-500',
                          isSelected && 'bg-blue-200',
                        )}
                      />
                    )}
                    {categories.includes('assessment') && (
                      <div
                        className={cn(
                          'size-1 rounded-full bg-orange-500',
                          isSelected && 'bg-orange-200',
                        )}
                      />
                    )}
                    {categories.includes('task') && (
                      <div
                        className={cn(
                          'size-1 rounded-full bg-green-500',
                          isSelected && 'bg-green-200',
                        )}
                      />
                    )}
                    {categories.includes('course') && (
                      <div
                        className={cn(
                          'size-1 rounded-full bg-violet-500',
                          isSelected && 'bg-violet-200',
                        )}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
