import { EnrollModal } from '@/components/courses/enroll-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRoles } from '@/hooks/use-roles';
import type { Course, User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Play } from 'lucide-react';
import { useState } from 'react';

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

interface CourseCardProps {
  course: Course & {
    lessons_count: number;
    instructor?: User;
    user_progress?: {
      progress_percentage: number;
      next_lesson?: unknown;
    };
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const { isAdmin, isTutor } = useRoles();
  const page = usePage<{ auth?: { user?: { id: number } } }>();
  const currentUserId = page.props.auth?.user?.id;
  const canManageCourse =
    isAdmin ||
    (isTutor &&
      currentUserId !== undefined &&
      course.instructor_id === currentUserId);

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base leading-tight font-semibold">
              {course.title}
            </CardTitle>
            {course.difficulty && (
              <Badge
                className={difficultyColors[course.difficulty]}
                variant="secondary"
              >
                {course.difficulty}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-3">
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">
            {course.lessons_count} lessons
          </div>
          {course.instructor && (
            <div className="text-xs text-muted-foreground">
              By {course.instructor.name}
            </div>
          )}
          {course.user_progress && (
            <div className="mt-auto space-y-1 pt-2">
              <div className="text-xs text-muted-foreground">
                {Math.round(course.user_progress.progress_percentage)}% complete
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${course.user_progress.progress_percentage}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          {canManageCourse ? (
            <Button className="w-full" size="sm" asChild>
              <Link href={`/courses/manage/${course.id}/edit`}>
                Manage Course
              </Link>
            </Button>
          ) : course.user_progress ? (
            <Button className="w-full" size="sm" asChild>
              <Link href={`/courses/${course.id}`}>
                <Play className="mr-2 size-4" />
                Continue Learning
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              size="sm"
              onClick={() => setIsEnrollModalOpen(true)}
            >
              Enroll Now
            </Button>
          )}
        </CardFooter>
      </Card>

      <EnrollModal
        courseId={course.id}
        courseTitle={course.title}
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
      />
    </>
  );
}
