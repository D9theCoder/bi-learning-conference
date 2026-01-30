import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  Activity,
  Award,
  Flame,
  LucideIcon,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function LiveProgressDashboard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <section className="overflow-hidden py-24" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold md:text-5xl">
            Live Progress Tracking
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch your growth in real-time.
          </p>
        </div>

        <div className="flex justify-center perspective-[1000px]">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-4xl"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <Card className="border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl dark:bg-background/50">
              <CardHeader className="border-b border-border/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-emerald-500">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>John Doe</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        >
                          Level 12
                        </Badge>
                        <span>Pro Learner</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm text-muted-foreground">
                      Current Session
                    </div>
                    <div className="font-mono text-xl font-bold text-emerald-500">
                      <CountUp value={45} duration={2} isInView={isInView} />{' '}
                      min
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-8 p-6 md:grid-cols-2">
                {/* Stats Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Zap className="h-4 w-4 text-amber-500" /> XP Earned
                      </span>
                      <span className="font-bold">
                        <CountUp
                          value={12500}
                          duration={2.5}
                          isInView={isInView}
                        />{' '}
                        / 15000
                      </span>
                    </div>
                    <AnimatedProgress
                      value={83}
                      isInView={isInView}
                      className="h-3 bg-muted"
                      indicatorClassName="bg-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Flame className="h-4 w-4 text-orange-500" /> Daily
                        Streak
                      </span>
                      <span className="font-bold">
                        <CountUp
                          value={14}
                          duration={1.5}
                          isInView={isInView}
                        />{' '}
                        Days
                      </span>
                    </div>
                    <AnimatedProgress
                      value={100}
                      isInView={isInView}
                      className="h-3 bg-muted"
                      indicatorClassName="bg-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Activity className="h-4 w-4 text-blue-500" /> Accuracy
                      </span>
                      <span className="font-bold">
                        <CountUp value={92} duration={2} isInView={isInView} />%
                      </span>
                    </div>
                    <AnimatedProgress
                      value={92}
                      isInView={isInView}
                      className="h-3 bg-muted"
                      indicatorClassName="bg-blue-500"
                    />
                  </div>
                </div>

                {/* Badges Column */}
                <div className="rounded-xl bg-muted/30 p-4">
                  <h3 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Recent Achievements
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <BadgeItem
                      icon={Trophy}
                      color="text-yellow-500"
                      label="Champion"
                      delay={0.2}
                      isInView={isInView}
                    />
                    <BadgeItem
                      icon={Star}
                      color="text-purple-500"
                      label="Rising Star"
                      delay={0.4}
                      isInView={isInView}
                    />
                    <BadgeItem
                      icon={Award}
                      color="text-emerald-500"
                      label="Perfect"
                      delay={0.6}
                      isInView={isInView}
                    />
                    <BadgeItem
                      icon={Zap}
                      color="text-blue-500"
                      label="Fast Learner"
                      delay={0.8}
                      isInView={isInView}
                    />
                    <BadgeItem
                      icon={Flame}
                      color="text-red-500"
                      label="On Fire"
                      delay={1.0}
                      isInView={isInView}
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={isInView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ delay: 1.2 }}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-background/50 p-3 text-center"
                    >
                      <span className="text-xs text-muted-foreground">
                        Next Badge
                      </span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CountUp({
  value,
  duration,
  isInView,
}: {
  value: number;
  duration: number;
  isInView: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevInView = useRef(false);

  useEffect(() => {
    if (isInView && !prevInView.current) {
      const node = nodeRef.current;
      if (node) {
        const controls = animate(0, value, {
          duration,
          onUpdate: (v) => {
            node.textContent = Math.round(v).toLocaleString();
          },
          ease: 'circOut',
        });
        return () => controls.stop();
      }
    }
    prevInView.current = isInView;
  }, [isInView, value, duration]);

  return <span ref={nodeRef}>0</span>;
}

function AnimatedProgress({
  value,
  isInView,
  className,
  indicatorClassName,
}: {
  value: number;
  isInView: boolean;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <Progress
      value={isInView ? value : 0}
      className={className}
      indicatorClassName={cn(
        'transition-all duration-1000 ease-out',
        indicatorClassName,
      )}
    />
  );
}

function BadgeItem({
  icon: Icon,
  color,
  label,
  delay,
  isInView,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  delay: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : {}}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay,
      }}
      className="flex flex-col items-center justify-center rounded-lg bg-background p-3 text-center shadow-sm transition-transform hover:scale-105"
    >
      <Icon className={cn('mb-2 h-6 w-6', color)} />
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
