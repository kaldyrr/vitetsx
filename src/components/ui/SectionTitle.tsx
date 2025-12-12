import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  label?: string;
  title: string;
  description?: ReactNode;
};

export const SectionTitle = ({ label, title, description }: Props) => (
  <div className="mb-8">
    {label ? (
      <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-neon" />
        {label}
      </span>
    ) : null}
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-3 text-3xl font-semibold md:text-4xl"
    >
      {title}
    </motion.h2>
    {description ? (
      <p className="max-w-2xl text-base text-muted md:text-lg">{description}</p>
    ) : null}
  </div>
);
