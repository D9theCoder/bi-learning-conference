import { show } from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalendarTask } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Clock, FileText, Video } from 'lucide-react';

interface TaskDateCardProps {
  date: string;
  tasks: CalendarTask[];
}

export function TaskDateCard({ date, tasks }: TaskDateCardProps) {
  const isOverdue =
    new Date(date) < new Date() && tasks.some((t) => !t.completed);
  const isPast = new Date(date) < new Date();

  const getCategoryIcon = (category: CalendarTask['category']) => {
    switch (category) {
      case 'meeting':
        return <Video className="size-3 text-blue-500" />;
      case 'assessment':
        return <Clock className="size-3 text-orange-500" />;
      case 'course':
        return <BookOpen className="size-3 text-violet-500" />;
      default:
        return <FileText className="size-3 text-green-500" />;
    }
  };

  const getCategoryColor = (category: CalendarTask['category']) => {
    switch (category) {
      case 'meeting':
        return 'border-l-blue-500';
      case 'assessment':
        return 'border-l-orange-500';
      case 'course':
        return 'border-l-violet-500';
      default:
        return 'border-l-green-500';
    }
  };

  const getRedirectHref = (task: CalendarTask) => {
    const sessionId = task.lesson_id ?? task.id;

    if (task.course_id) {
      return show.url(task.course_id, {
        query: {
          tab: task.category === 'assessment' ? 'assessment' : 'session',
          session: task.category === 'task' ? undefined : sessionId,
        },
      });
    }

    return task.meeting_url ?? null;
  };

  return (
    <div className={cn('space-y-0.5', isPast && 'opacity-60')}>
      <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
        {isOverdue && (
          <Badge variant="destructive" className="h-3.5 px-1 text-[10px]">
            Late
          </Badge>
        )}
      </div>
      <div className="space-y-0.5">
        {tasks.map((task) => {
          const redirectHref = getRedirectHref(task);

          return (
            <div
              key={`${task.category}-${task.id}`}
              className={cn(
                'flex items-center gap-1.5 border-l-2 bg-muted/10 px-1.5 py-1 text-sm',
                getCategoryColor(task.category),
              )}
            >
              {getCategoryIcon(task.category)}
              <div className="flex flex-1 items-center gap-1.5">
                <span
                  className={cn(
                    'flex-1 truncate',
                    task.completed && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title}
                </span>
                {redirectHref && (
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label="Open course details"
                  >
                    <Link href={redirectHref}>
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
              {task.time && (
                <span className="text-[11px] text-muted-foreground">
                  {task.time}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
