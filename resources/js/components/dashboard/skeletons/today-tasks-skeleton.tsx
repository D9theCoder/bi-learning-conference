import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

export const TodayTasksSkeleton = memo(() => (
  <Card>
    <CardContent className="space-y-3 p-6">
      <Skeleton className="h-5 w-40" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
      <Skeleton className="h-2 w-full" />
    </CardContent>
  </Card>
));

TodayTasksSkeleton.displayName = 'TodayTasksSkeleton';
