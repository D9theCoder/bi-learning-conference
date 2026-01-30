import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SuccessModal } from '@/components/ui/success-modal';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DailyTask } from '@/types';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  RefreshCw,
  ScrollText,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface TodayTaskListProps {
  tasks: DailyTask[];
  className?: string;
  showDebugButton?: boolean;
}

export function TodayTaskList({
  tasks,
  className,
  showDebugButton = true,
}: TodayTaskListProps) {
  const completedCount = tasks.filter((task) => task.is_completed).length;
  const totalCount = tasks.length;

  const [isGenerating, setIsGenerating] = useState(false);
  const [completedTask, setCompletedTask] = useState<DailyTask | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleGenerateTasks = () => {
    setIsGenerating(true);
    router.post(
      '/tasks/generate',
      {},
      {
        preserveScroll: true,
        onFinish: () => setIsGenerating(false),
      },
    );
  };

  const handleForceRegenerate = () => {
    if (
      !confirm(
        "This will delete all of today's quests and generate new ones. Continue?",
      )
    ) {
      return;
    }
    setIsGenerating(true);
    router.post(
      '/tasks/force-generate',
      {},
      {
        preserveScroll: true,
        onFinish: () => setIsGenerating(false),
      },
    );
  };

  const handleCompleteTask = (task: DailyTask) => {
    router.patch(
      `/tasks/${task.id}`,
      {
        completed: true,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setCompletedTask(task);
          setShowSuccessModal(true);
        },
      },
    );
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ScrollText className="size-5" /> Daily Quests
          </CardTitle>
          <div className="flex items-center gap-2">
            {showDebugButton && (
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={handleGenerateTasks}
                      disabled={isGenerating}
                    >
                      <Sparkles
                        className={cn(
                          'size-4',
                          isGenerating && 'animate-pulse',
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Generate tasks (if none exist)
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={handleForceRegenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw
                        className={cn('size-4', isGenerating && 'animate-spin')}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Force regenerate tasks</TooltipContent>
                </Tooltip>
              </div>
            )}
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {completedCount}/{totalCount} Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No quests available today
                  </motion.p>
                ) : (
                  tasks.map((task) => {
                    const isCompleted = task.is_completed;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={task.id}
                        className={cn(
                          'group flex items-start gap-4 rounded-xl border bg-card p-4 transition-all',
                          isCompleted
                            ? 'bg-muted/50 opacity-60'
                            : 'border-muted',
                        )}
                      >
                        <div className="mt-0.5">
                          <motion.div
                            initial={false}
                            animate={{ scale: isCompleted ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="size-5 text-green-500" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground" />
                            )}
                          </motion.div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <motion.label
                            animate={{
                              textDecorationLine: isCompleted
                                ? 'line-through'
                                : 'none',
                              color: isCompleted
                                ? 'var(--muted-foreground)'
                                : 'var(--foreground)',
                            }}
                            className="text-sm leading-none font-semibold"
                          >
                            {task.title}
                          </motion.label>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          {task.xp_reward && (
                            <div className="pt-2">
                              <Badge
                                variant="secondary"
                                className="border-none bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              >
                                <Zap className="mr-1 size-3 fill-yellow-700" />{' '}
                                +{task.xp_reward} XP
                              </Badge>
                            </div>
                          )}
                        </div>
                        {!isCompleted && (
                          <div className="pt-0.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCompleteTask(task)}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Task completed!"
        description={
          completedTask
            ? `You earned ${completedTask.xp_reward ?? 0} XP.`
            : undefined
        }
      />
    </>
  );
}
