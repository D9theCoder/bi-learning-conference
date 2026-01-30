import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Lesson } from '@/types';

interface SessionDetailsProps {
  session: Lesson;
  contentCount: number;
  assessmentCount: number;
  meetingStatus?: string;
}

export function SessionDetails({
  session,
  contentCount,
  assessmentCount,
  meetingStatus = 'No meeting scheduled',
}: SessionDetailsProps) {
  const hasDescription = Boolean(session.description?.trim());

  return (
    <Card className="border-border/60 bg-white shadow-sm dark:bg-slate-950">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Session {session.order ?? '-'}
            </p>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              {session.title}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {session.duration_minutes
                ? `${session.duration_minutes} mins`
                : 'No duration'}
            </Badge>
            <Badge variant="outline">{contentCount} materials</Badge>
            <Badge variant="outline">{assessmentCount} assessments</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasDescription ? (
          <div
            className="prose prose-sm max-w-none text-gray-600 dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: session.description || '',
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No session description yet.
          </p>
        )}

        <Separator />

        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-muted-foreground">Duration</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {session.duration_minutes
                ? `${session.duration_minutes} mins`
                : 'Not specified'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground">Order</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Session {session.order ?? '-'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground">Meeting</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {meetingStatus}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
