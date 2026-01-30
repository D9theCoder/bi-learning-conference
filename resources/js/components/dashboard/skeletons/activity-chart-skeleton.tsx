import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

export const ActivityChartSkeleton = memo(() => (
  <section aria-labelledby="activity-heading">
    <h2 id="activity-heading" className="text-xl font-semibold">
      Weekly Activity
    </h2>
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  </section>
));

ActivityChartSkeleton.displayName = 'ActivityChartSkeleton';
