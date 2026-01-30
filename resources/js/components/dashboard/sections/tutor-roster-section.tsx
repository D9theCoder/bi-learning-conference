import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TutorDashboardData } from '@/types';
import { Users } from 'lucide-react';
import { memo } from 'react';

interface TutorRosterSectionProps {
  roster: TutorDashboardData['roster'];
}

export const TutorRosterSection = memo(
  ({ roster }: TutorRosterSectionProps) => (
    <section aria-labelledby="tutor-roster-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h2
          id="tutor-roster-heading"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Student snapshot
        </h2>
      </div>
      <Card>
        <CardContent className="p-4">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {roster.map((student) => (
                <div
                  key={student.id}
                  className="space-y-2 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-foreground">
                          {student.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {student.courses} course
                          {student.courses === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {student.average_progress}%
                    </span>
                  </div>
                  <Progress value={student.average_progress} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  ),
);

TutorRosterSection.displayName = 'TutorRosterSection';
