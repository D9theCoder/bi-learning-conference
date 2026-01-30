import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Assessment, CourseContent } from '@/types';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
  BookOpen,
  CheckCircle,
  Download,
  FileText,
  Link as LinkIcon,
  Video,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';

interface SessionTodoListProps {
  contents: CourseContent[];
  assessments: Assessment[];
  currentLessonId: number | null;
  courseId: number;
  canViewContent: boolean;
}

function getIconForType(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5" />;
    case 'pdf':
    case 'file':
      return <FileText className="h-5 w-5" />;
    case 'quiz':
      return <CheckCircle className="h-5 w-5" />;
    case 'attendance':
      return <Wifi className="h-5 w-5" />;
    case 'link':
      return <LinkIcon className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
  }
}

function getAssessmentTypeLabel(type: Assessment['type']) {
  if (type === 'practice') {
    return 'Practice';
  }

  if (type === 'final_exam') {
    return 'Final Exam';
  }

  return 'Quiz';
}

function getAssessmentIcon(type: Assessment['type']) {
  if (type === 'final_exam') {
    return <FileText className="h-5 w-5" />;
  }

  return <CheckCircle className="h-5 w-5" />;
}

export function SessionTodoList({
  contents,
  assessments,
  currentLessonId,
  courseId,
  canViewContent,
}: SessionTodoListProps) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const sessionContents = contents.filter((content) => content.type !== 'assessment');
  const sessionAssessments = currentLessonId
    ? assessments.filter((assessment) => assessment.lesson_id === currentLessonId)
    : [];
  const hasItems = sessionContents.length > 0 || sessionAssessments.length > 0;
  const totalItems = sessionContents.length + sessionAssessments.length;

  const handleContentClick = async (content: CourseContent) => {
    if (!canViewContent) {
      return;
    }

    // Mark content as complete in the backend using axios (not Inertia)
    try {
      await axios.post(`/contents/${content.id}/complete`);
      setCompletedIds((prev) => new Set([...prev, content.id]));
    } catch (error) {
      console.error('Failed to mark content as complete:', error);
    }

    // Open content in new tab
    if (content.type === 'file' && content.file_path) {
      window.open(`/storage/${content.file_path}`, '_blank');
    } else if (
      (content.type === 'video' || content.type === 'link') &&
      content.url
    ) {
      window.open(content.url, '_blank');
    }
  };

  return (
    <Card className="border-border/60 bg-white shadow-sm dark:bg-slate-950">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Session checklist
          </CardTitle>
          <Badge variant="secondary">{totalItems} items</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything you need to complete for this session.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasItems ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Materials</span>
                <Badge variant="outline">{sessionContents.length}</Badge>
              </div>
              {sessionContents.map((content) => {
                const isCompleted = completedIds.has(content.id);
                return (
                  <div
                    key={`content-${content.id}`}
                    onClick={() => handleContentClick(content)}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      canViewContent
                        ? 'cursor-pointer border-border/60 bg-white hover:border-yellow-200 hover:bg-yellow-50 dark:bg-slate-900/60 dark:hover:bg-yellow-900/10'
                        : 'cursor-not-allowed border-border/40 bg-muted/40 opacity-70'
                    } transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-md p-2 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          getIconForType(content.type)
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
                            isCompleted ? 'line-through opacity-70' : ''
                          }`}
                        >
                          {content.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {content.duration_minutes
                            ? `${content.duration_minutes}m`
                            : 'Self-paced'}
                          {isCompleted ? ' • Completed' : ''}
                        </p>
                      </div>
                    </div>
                    {canViewContent && (content.file_path || content.url) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-yellow-700 dark:hover:text-yellow-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentClick(content);
                        }}
                      >
                        {content.type === 'file' ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {sessionAssessments.length > 0 && <Separator />}

            {sessionAssessments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Assessments</span>
                  <Badge variant="outline">{sessionAssessments.length}</Badge>
                </div>
                {sessionAssessments.map((assessment) => {
                  const typeLabel = getAssessmentTypeLabel(assessment.type);
                  const dueDate = assessment.due_date
                    ? new Date(assessment.due_date).toLocaleDateString()
                    : null;
                  const containerClass = `flex items-center justify-between rounded-lg border p-3 ${
                    canViewContent
                      ? 'cursor-pointer border-border/60 bg-white hover:border-yellow-200 hover:bg-yellow-50 dark:bg-slate-900/60 dark:hover:bg-yellow-900/10'
                      : 'cursor-not-allowed border-border/40 bg-muted/40 opacity-70'
                  } transition`;

                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          {getAssessmentIcon(assessment.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {assessment.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">{typeLabel}</Badge>
                            {dueDate ? <span>Due {dueDate}</span> : null}
                          </div>
                        </div>
                      </div>
                      {canViewContent ? (
                        <span className="text-xs text-muted-foreground">View</span>
                      ) : null}
                    </>
                  );

                  if (!canViewContent) {
                    return (
                      <div
                        key={`assessment-${assessment.id}`}
                        className={containerClass}
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={`assessment-${assessment.id}`}
                      href={`/courses/${courseId}/quiz/${assessment.id}`}
                      className={containerClass}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No materials listed for this session.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
