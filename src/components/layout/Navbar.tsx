import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';

type Props = {
  sections: { id: string; label: string }[];
  activeId: string;
  onNavigate: (id: string) => void;
  theme: 'cyber' | 'aqua';
  onToggleTheme: () => void;
};

export const Navbar = ({ sections, activeId, onNavigate, theme, onToggleTheme }: Props) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed inset-x-0 top-0 z-40 ${
        scrolled ? 'bg-[#050814]/70 shadow-lg backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onNavigate('hero')}
            className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-white"
            aria-label="Наверх"
          >
            <span className="h-2 w-2 rounded-full bg-accent shadow-neon" />
            Иван Петров
          </button>
          <div className="md:hidden">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
        <div className="hidden items-center gap-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted md:flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`relative rounded-full px-3 py-2 transition ${
                activeId === section.id ? 'text-white' : 'hover:text-white'
              }`}
            >
              {activeId === section.id ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-white/10"
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                />
              ) : null}
              {section.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto md:hidden">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] ${
                activeId === section.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="hidden md:block">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </motion.nav>
  );
};
