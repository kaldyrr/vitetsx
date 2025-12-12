import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  message: string;
  visible: boolean;
  onClose: () => void;
  autoHideAfter?: number;
};

export const Toast = ({ message, visible, onClose, autoHideAfter = 3200 }: Props) => {
  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(onClose, autoHideAfter);
    return () => window.clearTimeout(id);
  }, [visible, autoHideAfter, onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center">
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 210, damping: 18 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-gradient-to-r from-white/10 via-white/5 to-white/10 px-4 py-2 text-sm shadow-neon"
          >
            <span className="h-2 w-2 rounded-full bg-accent shadow-neon" />
            <span>{message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
