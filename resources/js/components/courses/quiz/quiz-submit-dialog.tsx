import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface QuizSubmitDialogProps {
  answeredCount: number;
  totalQuestions: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuizSubmitDialog({
  answeredCount,
  totalQuestions,
  onConfirm,
  onCancel,
}: QuizSubmitDialogProps) {
  const allAnswered = answeredCount >= totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 max-w-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-start gap-3">
            {!allAnswered ? (
              <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-500" />
            ) : (
              <CheckCircle className="h-6 w-6 shrink-0 text-green-500" />
            )}
            <div>
              <h3 className="font-semibold">Submit Quiz?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {!allAnswered
                  ? `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`
                  : 'You have answered all questions. Ready to submit?'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
