import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface QuizBuilderHeaderProps {
  courseId: number;
  courseTitle: string;
  assessmentTitle: string;
  isPublished: boolean;
}

export function QuizBuilderHeader({
  courseId,
  courseTitle,
  assessmentTitle,
  isPublished,
}: QuizBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.visit(`/courses/${courseId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Assessment Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            {courseTitle} - {assessmentTitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPublished
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>
    </div>
  );
}
