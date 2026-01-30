import { show } from '@/actions/App/Http/Controllers/CourseController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StudentCalendarItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Calendar as CalendarIcon, Clock, Video } from 'lucide-react';
import { memo } from 'react';

interface StudentCalendarSectionProps {
  items: StudentCalendarItem[];
}

export const StudentCalendarSection = memo(
  ({ items }: StudentCalendarSectionProps) => {
    const getRedirectHref = (item: StudentCalendarItem) => {
      if (item.course_id) {
        return show.url(item.course_id, {
          query: {
            tab: item.category === 'meeting' ? 'schedule' : 'assessment',
          },
        });
      }

      return item.meeting_url ?? null;
    };

    return (
      <section aria-labelledby="student-calendar-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-primary" />
          <h2
            id="student-calendar-heading"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            Upcoming Schedule
          </h2>
        </div>
        <Card noPadding className="py-2">
          <CardContent className="p-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming meetings or deadlines.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Legend */}
                <div className="mb-1 flex items-center gap-4 border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">
                      Meeting
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground">
                      Assessment
                    </span>
                  </div>
                </div>

                {items.map((item) => {
                  const redirectHref = getRedirectHref(item);

                  return (
                    <div
                      key={`${item.category}-${item.id}`}
                      className={cn(
                        'flex items-start justify-between gap-3 border-l-2 bg-muted/30 p-3',
                        item.category === 'meeting'
                          ? 'border-l-blue-500'
                          : 'border-l-orange-500',
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {item.category === 'meeting' ? (
                            <Video className="size-3.5 text-blue-500" />
                          ) : (
                            <Clock className="size-3.5 text-orange-500" />
                          )}
                          <span className="text-sm font-semibold text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.course_title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                              item.category === 'meeting'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
                            )}
                          >
                            {item.type}
                          </span>
                          {item.time && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {redirectHref && (
                          <Button
                            asChild
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label="Open course details"
                          >
                            <Link href={redirectHref}>
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </Button>
                        )}
                        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    );
  },
);

StudentCalendarSection.displayName = 'StudentCalendarSection';
