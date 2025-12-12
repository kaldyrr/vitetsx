import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="backtotop"
          onClick={scrollTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="fixed bottom-6 right-6 z-40 rounded-full border border-white/15 bg-surface px-4 py-3 text-sm text-white shadow-neon backdrop-blur"
          aria-label="Вернуться наверх"
        >
          ↑
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
};
