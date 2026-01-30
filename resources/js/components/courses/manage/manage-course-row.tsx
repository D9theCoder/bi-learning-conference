import { Button } from '@/components/ui/button';
import { Course, User } from '@/types';
import { Link } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { PublishStatusPill } from '../shared';

interface ManageCourseRowProps {
  course: Course & { instructor?: User };
}

export function ManageCourseRow({ course }: ManageCourseRowProps) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {course.title}
          </h3>
          <PublishStatusPill isPublished={course.is_published ?? false} />
        </div>
        <p className="text-sm text-muted-foreground">
          {course.category ?? 'Uncategorized'} ·{' '}
          {course.difficulty ?? 'Unspecified'}
        </p>
        {course.instructor && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>Instructor: {course.instructor.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/courses/${course.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
        <Link href={`/courses/manage/${course.id}/edit`}>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
}
