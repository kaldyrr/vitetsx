import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackToTopButton } from '../ui/BackToTopButton';
import { CustomCursor } from '../ui/CustomCursor';

type Props = {
  children: ReactNode;
  sections: { id: string; label: string }[];
  activeSection: string;
  onNavigate: (id: string) => void;
  theme: 'cyber' | 'aqua';
  onToggleTheme: () => void;
};

export const MainLayout = ({
  children,
  sections,
  activeSection,
  onNavigate,
  theme,
  onToggleTheme,
}: Props) => (
  <div className="relative min-h-screen overflow-hidden">
    <CustomCursor />
    <Navbar
      sections={sections}
      activeId={activeSection}
      onNavigate={onNavigate}
      theme={theme}
      onToggleTheme={onToggleTheme}
    />
    <div className="noise" aria-hidden />
    <main className="relative z-10 mx-auto max-w-6xl px-5 pt-28 md:pt-32">{children}</main>
    <Footer />
    <BackToTopButton />
  </div>
);
