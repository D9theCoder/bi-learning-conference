import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Assessment, StudentWithSubmissions } from '@/types';
import { Save } from 'lucide-react';

interface GradingStudentRowProps {
  student: StudentWithSubmissions;
  assessment: Assessment;
  currentScore: string;
  currentFeedback: string;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
}

export function GradingStudentRow({
  student,
  assessment,
  currentScore,
  currentFeedback,
  onScoreChange,
  onFeedbackChange,
  onSave,
}: GradingStudentRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-w-[200px] items-center gap-3">
        <Avatar>
          <AvatarImage src={student.avatar} />
          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{student.name}</p>
          <p className="text-xs text-gray-500">{student.email}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex gap-4">
          <div className="w-32">
            <Label className="text-xs">Score (/{assessment.max_score})</Label>
            <Input
              type="number"
              max={assessment.max_score}
              value={currentScore}
              onChange={(e) => onScoreChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Feedback</Label>
            <Input
              value={currentFeedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Good job..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-end">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="mr-1 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
