import { motion } from 'framer-motion';
import { type FormEvent, useState } from 'react';
import { SectionTitle } from '../ui/SectionTitle';
import { NeonButton } from '../ui/NeonButton';

type FormState = {
  name: string;
  email: string;
  message: string;
};

type Props = {
  onSubmit: (form: FormState) => void;
};

export const ContactSection = ({ onSubmit }: Props) => {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const validate = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.name.trim()) nextErrors.name = 'Заполните имя';
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      nextErrors.email = 'Укажите корректный email';
    if (!form.message.trim()) nextErrors.message = 'Напишите сообщение';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="scroll-section mt-16 rounded-3xl border border-white/10 bg-surface px-6 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:px-10">
      <SectionTitle
        label="Связаться"
        title="Контакты"
        description="Готов обсудить проекты, коллаборации и эксперименты. Напишите письмо или оставьте сообщение через форму."
      />
      <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6 }}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <p className="text-lg font-semibold text-white">Давай работать вместе</p>
          <p className="text-sm text-muted">
            Открыт к проектам, где важны анимации, визуальный характер и стабильная производительность. Напишите мне —
            отвечу быстро.
          </p>
          <div className="space-y-3 text-sm text-muted">
            <a className="block text-white hover:text-accent" href="mailto:vadim@example.com">
              vadim@example.com
            </a>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-full border border-white/10 px-3 py-1 hover:border-accent hover:text-white"
                href="https://github.com/kaldyrr"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a className="rounded-full border border-white/10 px-3 py-1 hover:border-accent hover:text-white" href="#">
                Telegram
              </a>
              <a className="rounded-full border border-white/10 px-3 py-1 hover:border-accent hover:text-white" href="#">
                Behance
              </a>
            </div>
          </div>
        </motion.div>
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          {([
            { id: 'name', label: 'Имя', type: 'text', placeholder: 'Ваше имя' },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'example@mail.com' },
          ] as const).map((field) => (
            <div key={field.id} className="space-y-2">
              <label htmlFor={field.id} className="text-sm text-white">
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                value={form[field.id]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.id]: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none transition focus:border-accent"
                placeholder={field.placeholder}
              />
              {errors[field.id] ? <p className="text-xs text-red-300">{errors[field.id]}</p> : null}
            </div>
          ))}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm text-white">
              Сообщение
            </label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none transition focus:border-accent"
              placeholder="Расскажите о задаче или идее"
            />
            {errors.message ? <p className="text-xs text-red-300">{errors.message}</p> : null}
          </div>
          <NeonButton type="submit">Отправить</NeonButton>
          <p className="text-xs text-muted">* Демо-форма: письмо не отправится, но появится красивый тост.</p>
        </motion.form>
      </div>
    </section>
  );
};
