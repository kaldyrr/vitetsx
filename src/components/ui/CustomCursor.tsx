import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(false);
  const reduced = usePrefersReducedMotion();
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  useEffect(() => {
    if (reduced || isTouchDevice) return;

    const move = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    const enter = () => setHidden(false);
    const leave = () => setHidden(true);
    const down = () => setActive(true);
    const up = () => setActive(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerenter', enter);
    window.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerenter', enter);
      window.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [reduced, isTouchDevice]);

  if (reduced || isTouchDevice) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/70 bg-accent/15 shadow-neon"
      animate={{
        x: pos.x,
        y: pos.y,
        scale: active ? 0.8 : 1,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  );
};
