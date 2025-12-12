import { motion } from 'framer-motion';

type Props = {
  theme: 'cyber' | 'aqua';
  onToggle: () => void;
};

export const ThemeToggle = ({ theme, onToggle }: Props) => {
  const isAqua = theme === 'aqua';

  return (
    <button
      onClick={onToggle}
      className="group relative flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted transition hover:border-accent hover:text-white"
      aria-label="Переключить тему"
      aria-pressed={isAqua}
    >
      <span className="h-2 w-2 rounded-full bg-accent shadow-neon" />
      {isAqua ? 'Кибер-синий' : 'Ультра-розовый'}
      <span className="relative ml-1 flex h-6 w-11 items-center rounded-full border border-white/10 bg-black/20 px-1">
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="h-4 w-4 rounded-full bg-gradient-to-br from-accent to-accent2 shadow-neon"
          style={{
            background: isAqua
              ? 'linear-gradient(135deg, #3fd8ff, #7c5bff)'
              : 'linear-gradient(135deg, #ff5efb, #3fd8ff)',
          }}
        />
      </span>
    </button>
  );
};
