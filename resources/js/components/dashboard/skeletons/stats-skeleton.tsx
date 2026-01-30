import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

export const StatsSkeleton = memo(() => (
  <section
    className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    aria-label="Loading statistics"
  >
    {[0, 1, 2, 3].map((i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </section>
));

StatsSkeleton.displayName = 'StatsSkeleton';
