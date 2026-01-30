import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Flame, Gamepad2, GraduationCap, Target, Trophy } from 'lucide-react';

export default function FeaturesBento() {
  return (
    <section className="container mx-auto px-4 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
          Why Choose Us?
        </h2>
        <p className="mt-4 text-muted-foreground md:text-xl">
          Everything you need to master your skills.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 lg:gap-8">
        {/* Large Vertical Card */}
        <Card className="group relative overflow-hidden border-border/40 bg-background transition-colors hover:bg-accent/10 md:col-span-2 md:row-span-2">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

          <CardHeader className="relative z-10">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              Gamified Learning
            </CardTitle>
            <CardDescription className="text-base">
              Experience learning like never before. Turn complex topics into
              engaging missions.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            {/* Video Placeholder */}
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-t-xl border-t border-border/20 bg-muted/50 p-4 md:aspect-auto md:h-full md:rounded-none md:border-none">
              <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-background/50 text-muted-foreground">
                <div className="text-center">
                  <Trophy className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">
                    Looping Gameplay Preview
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Stack Card 1 */}
        <Card className="group relative overflow-hidden border-border/40 bg-background transition-colors hover:bg-accent/10">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <CardTitle>Expert Tutors</CardTitle>
            <CardDescription>
              Get 1-on-1 guidance from industry professionals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center -space-x-2 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-2 ring-background"
                >
                  T{i}
                </div>
              ))}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-background">
                +42
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Stack Card 2 */}
        <Card className="group relative overflow-hidden border-border/40 bg-background transition-colors hover:bg-accent/10">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle>Daily Challenges</CardTitle>
            <CardDescription>
              Keep your streak alive with bite-sized tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                Active Streak
              </Badge>
              <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                <Flame
                  className="h-4 w-4 text-amber-500 dark:text-amber-400"
                  aria-hidden="true"
                />
                14 Days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
