import { motion, useInView, useAnimation } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  className?: string;
  delay?: number;
}

export const RevealOnScroll = ({
  children,
  width = 'fit-content',
  className = '',
  delay = 0.25,
}: RevealOnScrollProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px -50px 0px' });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <div ref={ref} style={{ width }} className={className}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={controls}
        transition={{ duration: 0.6, delay: delay, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default RevealOnScroll;
