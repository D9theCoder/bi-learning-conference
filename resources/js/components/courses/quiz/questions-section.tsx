import { NewQuestionForm, QuestionCard } from '@/components/courses/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssessmentQuestion } from '@/types';
import { router } from '@inertiajs/react';
import { Reorder } from 'framer-motion';
import { HelpCircle, ListOrdered, PenLine, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const questionTypes = [
  {
    value: 'multiple_choice',
    label: 'Multiple Choice',
    icon: ListOrdered,
    description: 'Auto-graded, 4 options max',
  },
  {
    value: 'fill_blank',
    label: 'Fill in the Blank',
    icon: PenLine,
    description: 'Auto-graded, exact match',
  },
  {
    value: 'essay',
    label: 'Essay',
    icon: HelpCircle,
    description: 'Manual grading by tutor',
  },
] as const;

interface QuestionsSectionProps {
  questions: AssessmentQuestion[];
  courseId: number;
  assessmentId: number;
}

export function QuestionsSection({
  questions,
  courseId,
  assessmentId,
}: QuestionsSectionProps) {
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<
    'multiple_choice' | 'fill_blank' | 'essay'
  >('multiple_choice');

  const [items, setItems] = useState<AssessmentQuestion[]>(questions);

  // Sync internal state when questions prop changes (e.g., after add/delete/refresh)
  useEffect(() => {
    setItems(questions);
  }, [questions]);

  const handleReorder = (newItems: AssessmentQuestion[]) => {
    setItems(newItems);

    // Persist new order to backend
    router.post(
      `/courses/${courseId}/quiz/${assessmentId}/questions/reorder`,
      {
        questions: newItems.map((q, idx) => ({
          id: q.id,
          order: idx + 1,
        })),
      },
      {
        preserveScroll: true,
        preserveState: true,
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Questions</CardTitle>
        <Button size="sm" onClick={() => setShowNewQuestion(!showNewQuestion)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewQuestion && (
          <div className="rounded-lg border-2 border-dashed border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/10">
            <p className="mb-3 font-medium text-yellow-800 dark:text-yellow-500">
              Choose question type:
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {questionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setNewQuestionType(type.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                    newQuestionType === type.value
                      ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <NewQuestionForm
                courseId={courseId}
                assessmentId={assessmentId}
                type={newQuestionType}
                onCancel={() => setShowNewQuestion(false)}
                onSuccess={() => setShowNewQuestion(false)}
              />
            </div>
          </div>
        )}

        {items && items.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {items.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                courseId={courseId}
                assessmentId={assessmentId}
              />
            ))}
          </Reorder.Group>
        ) : (
          !showNewQuestion && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No questions yet. Click "Add Question" to get started.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
