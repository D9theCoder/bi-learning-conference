import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

interface ManageCourseCardProps {
  courseId: number;
}

export function ManageCourseCard({ courseId }: ManageCourseCardProps) {
  return (
    <Card
      className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10"
    >
      <CardContent>
        <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-500">
          Manage this course
        </h3>
        <p className="mb-4 text-sm text-yellow-700 dark:text-yellow-600">
          Update course details, lessons, and content.
        </p>
        <Button className="w-full" asChild>
          <Link href={`/courses/manage/${courseId}`}>Manage Course</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface EnrollPromptCardProps {
  onEnrollClick: () => void;
}

export function EnrollPromptCard({ onEnrollClick }: EnrollPromptCardProps) {
  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
      <CardContent className="pt-6">
        <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-500">
          Start Learning
        </h3>
        <p className="mb-4 text-sm text-yellow-700 dark:text-yellow-600">
          Enroll in this course to access materials and track your progress.
        </p>
        <Button
          className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
          onClick={onEnrollClick}
        >
          Enroll Now
        </Button>
      </CardContent>
    </Card>
  );
}
