import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizInstructionsCardProps {
  timeLimitMinutes: number | null;
  hasEssayQuestions: boolean;
}

export function QuizInstructionsCard({
  timeLimitMinutes,
  hasEssayQuestions,
}: QuizInstructionsCardProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-none space-y-2 pl-0 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            Answer all questions to the best of your ability
          </li>
          {timeLimitMinutes && (
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              Assessment will auto-submit when time expires
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            Your progress is saved automatically
          </li>
          {hasEssayQuestions && (
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              Essay questions will be graded by the tutor
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
