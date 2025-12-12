import { useEffect, useState } from 'react';
import { MultiWindowPortal } from './components/visuals/MultiWindowPortal';
import { NeonButton } from './components/ui/NeonButton';
import { ThemeToggle } from './components/ui/ThemeToggle';

export const PortalPage = () => {
  const [theme, setTheme] = useState<'cyber' | 'aqua'>(() => {
    const stored = document.documentElement.dataset.theme as 'cyber' | 'aqua' | undefined;
    return stored ?? 'cyber';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const openAnotherWindow = () => {
    const portalUrl = `${import.meta.env.BASE_URL}portal.html`;
    window.open(portalUrl, '_blank', 'popup,width=640,height=520');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="noise" aria-hidden />
      <div className="fixed inset-0 -z-10 opacity-95">
        <MultiWindowPortal fullscreen showBadge={false} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,94,251,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(63,216,255,0.16),transparent_50%)] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-accent shadow-neon" />
          WebGL / Generative
        </div>
        <h1 className="glow-text text-4xl font-semibold text-white md:text-6xl">Неоновый портал</h1>
        <p className="max-w-2xl text-sm text-muted md:text-base">
          Мини‑сцена на Three.js: мягкий неон, глубина и пыль частиц. Такой эффект можно аккуратно
          встраивать в интерфейсы и лендинги, чтобы добавить “вау” без перегруза.
        </p>
        <p className="max-w-2xl text-xs uppercase tracking-[0.18em] text-white/70 md:text-sm">
          Открой несколько окон и разложи их рядом — увидишь цельную сцену между ними.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <NeonButton href={`${import.meta.env.BASE_URL}`}>Назад в портфолио</NeonButton>
          <NeonButton variant="ghost" onClick={openAnotherWindow} className="px-5 py-3">
            Открыть ещё окно
          </NeonButton>
          <NeonButton
            variant="ghost"
            onClick={() => window.location.reload()}
            className="px-5 py-3"
            aria-label="Перезапустить портал"
          >
            Перезапустить
          </NeonButton>
        </div>
      </div>

      <div className="fixed right-5 top-5 z-20 hidden md:block">
        <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'cyber' ? 'aqua' : 'cyber'))} />
      </div>
    </div>
  );
};
