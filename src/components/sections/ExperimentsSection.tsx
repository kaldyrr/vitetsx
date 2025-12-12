import { motion } from 'framer-motion';
import { experiments } from '../../data/experiments';
import { SectionTitle } from '../ui/SectionTitle';
import { NodeNetworkCanvas } from '../visuals/NodeNetworkCanvas';
import { StarfieldCanvas } from '../visuals/StarfieldCanvas';
import { MultiWindowPortal } from '../visuals/MultiWindowPortal';
import { NeonButton } from '../ui/NeonButton';

export const ExperimentsSection = () => {
  const openPortalPage = () => {
    const portalUrl = `${import.meta.env.BASE_URL}portal.html`;
    window.open(portalUrl, '_blank');
  };

  return (
    <section
      id="experiments"
      className="scroll-section mt-16 rounded-3xl border border-white/10 bg-surface px-6 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:px-10"
    >
      <SectionTitle
        label="Песочница"
        title="Эксперименты"
        description="Небольшие визуальные исследования: Canvas‑узлы, CSS‑сетка и WebGL‑галактики, которые живут сразу в нескольких окнах."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {experiments.map((exp, index) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ delay: index * 0.08, duration: 0.6 }}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.35)] ${
              exp.id === 'portal' ? 'md:col-span-3' : ''
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent2 to-transparent opacity-60" />
            <div className="p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
                <span>{exp.label}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/70">
                  {exp.intensity === 'bold' ? 'Bold' : 'Calm'}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{exp.title}</h3>
              <p className="text-sm text-muted">{exp.description}</p>
            </div>
            <div className={`relative w-full overflow-hidden ${exp.id === 'portal' ? 'h-64 md:h-80' : 'h-48'}`}>
              {exp.id === 'portal' ? (
                <div className="relative h-full w-full">
                  <MultiWindowPortal className="h-full w-full" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,94,251,0.22),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(63,216,255,0.22),transparent_45%)] mix-blend-screen" />
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    <NeonButton
                      variant="ghost"
                      onClick={openPortalPage}
                      className="px-4 py-2 text-[11px]"
                      aria-label="Открыть галактики на отдельной странице"
                    >
                      Открыть галактики
                    </NeonButton>
                  </div>
                </div>
              ) : exp.id === 'nodes' ? (
                <NodeNetworkCanvas className="h-full" density={90} />
              ) : exp.id === 'particles' ? (
                <div className="relative h-full w-full">
                  <StarfieldCanvas density={120} className="opacity-80" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,94,251,0.16),transparent_55%)]" />
                </div>
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_15%_20%,rgba(255,94,251,0.22),transparent_35%),radial-gradient(circle_at_75%_70%,rgba(63,216,255,0.22),transparent_38%),linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,100%_100%,24px_24px,24px_24px]" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
