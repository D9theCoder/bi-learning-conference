import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const testimonials1 = [
  {
    name: 'Sarah L.',
    role: 'Student',
    text: 'Bi-Learning changed how I study completely. The gamification is addictive!',
  },
  {
    name: 'Mike T.',
    role: 'Developer',
    text: 'The tutors are world-class. I learned React in a week.',
  },
  {
    name: 'Jessica K.',
    role: 'Designer',
    text: 'Beautiful interface and seamless experience. Highly recommended.',
  },
  {
    name: 'Alex R.',
    role: 'Product Manager',
    text: 'Tracking my progress has never been easier. Love the dashboard.',
  },
  {
    name: 'Emily W.',
    role: 'Data Scientist',
    text: 'Excellent content structure and challenges.',
  },
];

const testimonials2 = [
  {
    name: 'David B.',
    role: 'Marketing',
    text: "I recommend this to everyone in my team. It's a game changer.",
  },
  {
    name: 'Lisa M.',
    role: 'Teacher',
    text: 'As an educator, I appreciate the pedagogical approach here.',
  },
  {
    name: 'Tom H.',
    role: 'Freelancer',
    text: 'Worth every penny. The skills I gained have paid off 10x.',
  },
  {
    name: 'Anna P.',
    role: 'Student',
    text: "Simply the best learning platform I've used.",
  },
  {
    name: 'James C.',
    role: 'Engineer',
    text: 'Technical depth is surprisingly good for a gamified platform.',
  },
];

export default function TestimonialsMarquee() {
  return (
    <section className="overflow-hidden bg-muted/30 py-24 text-center">
      <div className="mb-12 px-4">
        <h2 className="text-3xl font-bold md:text-5xl">What Learners Say</h2>
        <p className="mt-4 text-muted-foreground">
          Join thousands of satisfied students.
        </p>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* Gradient Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        {/* Row 1 */}
        <MarqueeRow items={testimonials1} direction="left" speed={25} />

        {/* Row 2 */}
        <MarqueeRow items={testimonials2} direction="right" speed={30} />
      </div>
    </section>
  );
}

function MarqueeRow({
  items,
  direction,
  speed,
}: {
  items: typeof testimonials1;
  direction: 'left' | 'right';
  speed: number;
}) {
  return (
    <div className="flex w-full overflow-hidden select-none">
      <motion.div
        className="flex min-w-full shrink-0 items-center justify-around gap-8 py-4"
        initial={{ x: direction === 'left' ? 0 : '-100%' }}
        animate={{ x: direction === 'left' ? '-100%' : 0 }}
        transition={{
          duration: speed,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {[...items, ...items, ...items].map(
          (
            t,
            i, // Repeat items to ensure smooth loop
          ) => (
            <TestimonialCard key={i} {...t} />
          ),
        )}
      </motion.div>
    </div>
  );
}

function TestimonialCard({
  name,
  role,
  text,
}: {
  name: string;
  role: string;
  text: string;
}) {
  return (
    <Card className="w-[350px] shrink-0 border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:bg-background">
      <CardContent className="p-6">
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          "{text}"
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-600">
              {name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">{role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
