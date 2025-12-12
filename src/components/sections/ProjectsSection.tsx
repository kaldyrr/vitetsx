import { motion } from 'framer-motion';
import { type CSSProperties, useState } from 'react';
import type { Project } from '../../types';
import { SectionTitle } from '../ui/SectionTitle';

type Props = {
  projects: Project[];
  onOpen: (project: Project) => void;
};

export const ProjectsSection = ({ projects, onOpen }: Props) => (
  <section id="projects" className="scroll-section mt-16">
    <SectionTitle
      label="Портфолио"
      title="Проекты"
      description="Подборка свежих работ: лендинги, анимации и небольшие продукты. Каждый проект — баланс визуала и производительности."
    />
    <div className="grid gap-5 md:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} onOpen={onOpen} delay={index * 0.05} />
      ))}
    </div>
  </section>
);

const ProjectCard = ({
  project,
  onOpen,
  delay,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  delay: number;
}) => {
  const [style, setStyle] = useState<CSSProperties>({});

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 6;
    setStyle({ transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)` });
  };

  const handleLeave = () => setStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ delay, duration: 0.65, ease: 'easeOut' }}
      className="relative"
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onClick={() => onOpen(project)}
        className="group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-surface p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition duration-300 hover:border-accent/60"
        style={style}
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
          <span>{project.category}</span>
          <span className="text-white/70">{project.year}</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-white group-hover:text-white">{project.title}</h3>
        <p className="mt-2 text-sm text-muted">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted transition group-hover:border-accent/60 group-hover:text-white"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm text-accent">
          <span className="h-px flex-1 bg-gradient-to-r from-accent/60 via-accent/30 to-transparent" />
          <span className="shrink-0">Подробнее</span>
        </div>
      </div>
    </motion.div>
  );
};
