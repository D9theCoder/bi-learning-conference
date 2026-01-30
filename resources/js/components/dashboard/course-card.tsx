import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Enrollment } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Play } from 'lucide-react';

interface CourseCardProps {
  enrollment: Enrollment;
  onResume?: () => void;
}

export function CourseCard({ enrollment, onResume }: CourseCardProps) {
  const { course, progress_percentage = 0, next_lesson } = enrollment;

  // Handle null/undefined course
  if (!course) {
    return null;
  }

  return (
    <Card
      noPadding
      className="group relative overflow-hidden transition-all hover:shadow-md"
    >
      <CardContent className="flex gap-4 p-0">
        {/* Course Thumbnail */}
        <div className="relative size-32 shrink-0 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <BookOpen className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-3 pr-4">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground">
              {course.title || 'Untitled Course'}
            </h3>
            {course.category && (
              <Badge
                variant="outline"
                className="h-5 w-fit px-1.5 py-0 text-[10px]"
              >
                {course.category}
              </Badge>
            )}

            {next_lesson?.title && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                Next:{' '}
                <span className="font-medium text-foreground">
                  {next_lesson.title}
                </span>
              </p>
            )}

          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">{progress_percentage}%</span>
            </div>
            <Progress value={progress_percentage} className="h-2 w-full" />
          </div>
        </div>
      </CardContent>

      {/* Resume Button - Slides up on hover */}
      <div className="absolute inset-0 flex items-center justify-end bg-gradient-to-l from-background/90 via-background/50 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
        <Button
          asChild
          onClick={onResume}
          size="sm"
          className="translate-y-2 shadow-lg transition-transform duration-300 group-hover:translate-y-0"
        >
          <Link href={`/courses/${course.id}`}>
            <Play className="mr-2 size-3" />
            Resume
          </Link>
        </Button>
      </div>
    </Card>
  );
}
