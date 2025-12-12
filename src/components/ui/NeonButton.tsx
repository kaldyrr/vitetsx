import { motion } from 'framer-motion';
import type { ComponentProps, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  variant?: 'solid' | 'ghost';
  href?: string;
  className?: string;
} & Pick<ComponentProps<'button'>, 'onClick' | 'type' | 'aria-label'>;

export const NeonButton = ({
  children,
  variant = 'solid',
  href,
  className = '',
  ...rest
}: Props) => {
  const baseClasses =
    'relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-300';
  const solid =
    'bg-[radial-gradient(circle_at_20%_20%,rgba(255,94,251,0.5),rgba(255,94,251,0.1)_40%),radial-gradient(circle_at_80%_0%,rgba(63,216,255,0.5),rgba(63,216,255,0.08)_42%)] text-white shadow-neon';
  const ghost =
    'border border-white/20 bg-white/5 text-white hover:border-accent hover:text-accent shadow-[0_0_0_0_rgba(0,0,0,0)]';

  if (href) {
    return (
      <motion.a
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        href={href}
        rel="noreferrer"
        target="_blank"
        className={`${baseClasses} ${variant === 'solid' ? solid : ghost} ${className}`}
        aria-label={rest['aria-label']}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_55%)] opacity-80" />
      </motion.a>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      type={rest.type ?? 'button'}
      onClick={rest.onClick}
      aria-label={rest['aria-label']}
      className={`${baseClasses} ${variant === 'solid' ? solid : ghost} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_55%)] opacity-80" />
    </motion.button>
  );
};
