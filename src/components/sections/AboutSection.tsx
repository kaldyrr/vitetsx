import { motion } from 'framer-motion';
import { SectionTitle } from '../ui/SectionTitle';

const skills = [
  'HTML / CSS',
  'JavaScript / TypeScript',
  'React 18',
  'Framer Motion',
  'Tailwind CSS',
  'Canvas',
  'Creative Coding',
  'UI/UX',
  'Анимации',
  'Доступность',
];

const focuses = [
  { title: 'Лэндинги', desc: 'Острое ощущение бренда, гладкие переходы' },
  { title: 'Анимации', desc: 'Сбалансированные микровзаимодействия' },
  { title: 'Эксперименты', desc: 'Генеративная графика и интерактив' },
  { title: 'Производительность', desc: 'Лёгкие сборки под статический хостинг' },
];

export const AboutSection = () => (
  <section id="about" className="scroll-section mt-16 rounded-3xl border border-white/10 bg-surface px-6 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:px-10">
    <SectionTitle
      label="Кто я"
      title="Обо мне"
      description="Я собираю визуально сильные интерфейсы: от неоновых лендингов до аккуратных продуктовых панелей. Люблю, когда анимации подчёркивают смысл, а код остаётся чистым."
    />
    <div className="grid gap-10 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7 }}
        className="space-y-4 text-muted"
      >
        <p>
          Работаю на стыке дизайна и разработки: проектирую логику интерфейса, подбираю анимации под историю бренда
          и оптимизирую взаимодействия под реальные устройства.
        </p>
        <p>
          Для меня важно, чтобы сайт запускался быстро, оставался понятным без анимаций и одновременно радовал тех,
          кто любит динамику. Поэтому уделяю внимание доступности и prefers-reduced-motion.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="neon-border relative rounded-full px-3 py-2 text-xs font-semibold text-white/90"
            >
              {skill}
            </span>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.75, delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {focuses.map((item) => (
          <div key={item.title} className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-sm text-muted">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);
