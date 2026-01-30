import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface TaskCheckboxProps {
  task: {
    id: number;
    title: string;
    completed: boolean;
    due_date?: string;
    xp_reward?: number;
    course_title?: string;
    type?: string;
  };
}

export function TaskCheckbox({ task }: TaskCheckboxProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
      <div className="mt-0.5">
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <div
          className={cn(
            'font-medium',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-medium',
              task.completed
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700',
            )}
          >
            {task.completed ? 'Completed' : 'Scheduled'}
          </span>
          {task.xp_reward && <span>{task.xp_reward} XP</span>}
        </div>
      </div>
    </div>
  );
}
