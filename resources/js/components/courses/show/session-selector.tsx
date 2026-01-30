import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Lesson } from '@/types';

interface SessionSelectorProps {
  lessons: Lesson[];
  activeSessionId: string;
  onSessionChange: (sessionId: string) => void;
}

export function SessionSelector({
  lessons,
  activeSessionId,
  onSessionChange,
}: SessionSelectorProps) {
  return (
    <Card className="border-border/60 bg-amber-50 shadow-sm dark:bg-slate-950">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base text-gray-900 dark:text-gray-100">
            Sessions
          </CardTitle>
          <Badge variant="secondary">{lessons.length} total</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Jump to a session to review materials and session notes.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
          {lessons.map((lesson, index) => {
            const isActive = activeSessionId === lesson.id.toString();
            return (
              <button
                key={lesson.id}
                onClick={() => onSessionChange(lesson.id.toString())}
                className={cn(
                  'group flex min-w-[180px] flex-shrink-0 flex-col gap-1 rounded-xl border px-4 py-3 text-left text-sm transition',
                  isActive
                    ? 'border-yellow-400 bg-yellow-500 text-white shadow-sm'
                    : 'border-border/60 bg-white/80 text-gray-700 hover:border-yellow-200 hover:bg-yellow-50 dark:bg-slate-900/60 dark:text-gray-200 dark:hover:bg-yellow-900/10',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    isActive ? 'text-yellow-100' : 'text-muted-foreground',
                  )}
                >
                  Session {index + 1}
                </span>
                <span className="text-sm font-semibold">{lesson.title}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
