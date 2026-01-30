import { show as showCourse } from '@/actions/App/Http/Controllers/CourseController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRoles } from '@/hooks/use-roles';
import { messages } from '@/routes';
import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, MessageSquare } from 'lucide-react';

interface StudentCardProps {
  student: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    level?: number | null;
    points_balance?: number | null;
    total_xp?: number | null;
    enrollments_count?: number | null;
    active_enrollments_count?: number | null;
    enrollments?: Array<{
      id: number;
      course: {
        id: number;
        title: string;
        thumbnail?: string;
      };
      progress_percentage: number;
      status: 'active' | 'completed' | 'paused';
    }> | null;
  };
}

export function StudentCard({ student }: StudentCardProps) {
  const { isAdmin, isTutor } = useRoles();
  const isAdminOrTutor = isAdmin || isTutor;
  const enrollmentsCount = student.enrollments_count ?? 0;
  const activeEnrollmentsCount = student.active_enrollments_count ?? 0;
  const statusLabel =
    activeEnrollmentsCount > 0
      ? 'Active'
      : enrollmentsCount > 0
        ? 'Inactive'
        : 'Not enrolled';

  const statusVariant =
    activeEnrollmentsCount > 0
      ? 'default'
      : enrollmentsCount > 0
        ? 'secondary'
        : 'outline';

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            <AvatarImage src={student.avatar} />
            <AvatarFallback>{student.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">
              {student.name}
              {student.email && (
                <p className="text-sm text-muted-foreground">{student.email}</p>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {isAdminOrTutor ? (
          <>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Level</span>
                <span className="font-semibold text-foreground">
                  {student.level ?? 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Points</span>
                <span className="font-semibold text-foreground">
                  {student.points_balance ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total XP</span>
                <span className="font-semibold text-foreground">
                  {student.total_xp ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Course status</span>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            </div>

            {student.enrollments && student.enrollments.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="size-4 text-muted-foreground" />
                  <span>Enrolled Courses ({student.enrollments.length})</span>
                </div>
                <div className="max-h-48 space-y-3 overflow-y-auto">
                  {student.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <div className="flex items-start gap-2">
                        {enrollment.course.thumbnail && (
                          <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                            className="size-10 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {enrollment.course.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant={
                                enrollment.status === 'completed'
                                  ? 'default'
                                  : enrollment.status === 'active'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="h-4 px-1.5 text-[10px] capitalize"
                            >
                              {enrollment.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {enrollment.progress_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={enrollment.progress_percentage}
                        className="h-1.5"
                      />
                      <Link href={showCourse(enrollment.course.id).url}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-full text-xs"
                        >
                          View Course
                          <ArrowRight className="ml-1 size-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
      {!isAdminOrTutor ? (
        <CardFooter className="mt-auto">
          <Link
            href={`${messages().url}?partner=${student.id}`}
            className="w-full"
          >
            <Button className="w-full" size="sm">
              <MessageSquare className="mr-2 size-4" />
              Contact Student
            </Button>
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}
