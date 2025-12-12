import { motion } from 'framer-motion';
import { GlitchText } from '../visuals/GlitchText';
import { NeonButton } from '../ui/NeonButton';
import { StarfieldCanvas } from '../visuals/StarfieldCanvas';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Props = {
  onPortfolio: () => void;
  onContact: () => void;
};

export const HeroSection = ({ onPortfolio, onContact }: Props) => {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="hero"
      className="scroll-section relative flex min-h-[78vh] items-center overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-neon"
    >
      <div className="absolute inset-0 opacity-90">
        <StarfieldCanvas density={reduced ? 140 : 220} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,94,251,0.15),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(63,216,255,0.14),transparent_45%)]" />
      <div className="relative z-10 grid gap-10 px-6 py-14 md:grid-cols-2 md:px-10 md:py-16">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted"
        >
          <span className="h-2 w-2 rounded-full bg-accent shadow-neon" />
          Фронтенд / Креативный код
        </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="space-y-4"
          >
            <GlitchText
              text="Вадим Павлов"
              className="block text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
            />
            <p className="text-lg text-muted md:text-xl">
              Креативный фронтенд-разработчик. Создаю неоновые интерфейсы, анимации, интерактивные истории и
              визуальные эффекты, которые заставляют пользователей залипать.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-wrap gap-3"
          >
            <NeonButton onClick={onPortfolio}>Портфолио</NeonButton>
            <NeonButton variant="ghost" onClick={onContact}>
              Написать мне
            </NeonButton>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="grid grid-cols-2 gap-3 text-sm text-muted md:grid-cols-3"
          >
            {[
              { title: 'Анимации', desc: 'Framer Motion и Canvas' },
              { title: 'UI/UX', desc: 'Сильная визуальная система' },
              { title: 'Производительность', desc: 'Оптимизация под статику' },
            ].map((item) => (
              <div
                key={item.title}
                className="panel rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 14 }}
          className="relative flex items-center justify-center"
        >
          <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,94,251,0.14),transparent_55%),radial-gradient(circle_at_60%_65%,rgba(63,216,255,0.16),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-neon">
            <div className="twinkle" />
            <div className="absolute inset-[14%] rounded-2xl border border-white/10" />
            <div className="absolute inset-[6%] rounded-3xl bg-grid-neon opacity-30" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">креативный код</p>
              <p className="text-3xl font-semibold text-white">Неоновый поток</p>
              <p className="max-w-xs text-sm text-muted">
                Лёгкая, но впечатляющая графика без WebGL. Управляемые эффекты и чистая типографика.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
