import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

export const CoursesSkeleton = memo(() => (
  <section aria-labelledby="courses-heading">
    <h2 id="courses-heading" className="mb-4 text-xl font-semibold">
      My Courses
    </h2>
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardHeader className="relative p-0">
            <Skeleton className="aspect-video w-full rounded-t-lg" />
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
));

CoursesSkeleton.displayName = 'CoursesSkeleton';
