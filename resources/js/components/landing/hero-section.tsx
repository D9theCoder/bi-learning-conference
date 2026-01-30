import { Button } from '@/components/ui/button';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  Variants,
} from 'framer-motion';
import { MouseEvent } from 'react';

export default function HeroSection({ onStart }: { onStart: () => void }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const maskImage = useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <section
      className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden bg-background py-10 md:py-20"
      onMouseMove={handleMouseMove}
    >
      {/* Background Dot Pattern (Base - Dim) */}
      <div
        className="absolute inset-0 z-0 bg-background opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-[0.1] dark:bg-background"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      ></div>

      {/* Background Dot Pattern (Highligt - Visible on Hover) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 bg-emerald-500/10 dark:bg-emerald-500/20"
        style={{
          backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          ...style,
        }}
      />

      <div className="relative z-20 flex max-w-5xl flex-col items-center px-4 text-center">
        <AnimatedHeadline text="Learn Smarter. Achieve Faster." />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Unlock your potential with gamified learning, expert tutors, and
          real-time progress tracking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-10"
        >
          <ShineButton onClick={onStart}>Get Started Now</ShineButton>
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(' ');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
    },
  };

  return (
    <motion.h1
      className="flex flex-wrap justify-center overflow-hidden text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <span key={index} className="mr-4 flex">
          {word.split('').map((character, i) => (
            <motion.span variants={child} key={i}>
              {character}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}

function ShineButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      size="lg"
      className="relative overflow-hidden bg-emerald-600 px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-500/25"
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 -translate-x-[100%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </Button>
  );
}
