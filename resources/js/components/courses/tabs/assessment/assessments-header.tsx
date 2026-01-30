import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Plus } from 'lucide-react';

interface AssessmentsHeaderProps {
  isTutor: boolean;
  onCreateQuiz: () => void;
  description: string;
}

export function AssessmentsHeader({
  isTutor,
  onCreateQuiz,
  description,
}: AssessmentsHeaderProps) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-start gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          Assessments
        </CardTitle>
        {isTutor && (
          <Button size="sm" onClick={onCreateQuiz}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        )}
      </div>
      <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </CardDescription>
    </CardHeader>
  );
}
