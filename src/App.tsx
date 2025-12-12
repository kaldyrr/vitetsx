import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { HeroSection } from './components/sections/HeroSection';
import { AboutSection } from './components/sections/AboutSection';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { ExperimentsSection } from './components/sections/ExperimentsSection';
import { ContactSection } from './components/sections/ContactSection';
import { Modal } from './components/ui/Modal';
import { Toast } from './components/ui/Toast';
import { projects } from './data/projects';
import { useScrollToSection } from './hooks/useScrollToSection';
import { useScrollSpy } from './hooks/useScrollSpy';
import type { Project } from './types';

const navSections = [
  { id: 'hero', label: 'Вступление' },
  { id: 'about', label: 'Обо мне' },
  { id: 'projects', label: 'Проекты' },
  { id: 'experiments', label: 'Эксперименты' },
  { id: 'contact', label: 'Контакты' },
];

function App() {
  const [theme, setTheme] = useState<'cyber' | 'aqua'>('cyber');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const scrollTo = useScrollToSection();
  const sectionIds = useMemo(() => navSections.map((s) => s.id), []);
  const activeSection = useScrollSpy(sectionIds);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const grid =
      'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)';
    document.documentElement.style.setProperty('--grid-image', grid);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'cyber' ? 'aqua' : 'cyber'));

  const handleFormSubmit = (_form: { name: string; email: string; message: string }) => {
    setToastMessage('Сообщение отправлено (на самом деле это демо)');
    setToastVisible(true);
  };

  return (
    <>
      <MainLayout
        sections={navSections}
        activeSection={activeSection}
        onNavigate={scrollTo}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        <HeroSection onPortfolio={() => scrollTo('projects')} onContact={() => scrollTo('contact')} />
        <AboutSection />
        <ProjectsSection projects={projects} onOpen={setSelectedProject} />
        <ExperimentsSection />
        <ContactSection onSubmit={handleFormSubmit} />
      </MainLayout>

      <Modal open={Boolean(selectedProject)} title={selectedProject?.title} onClose={() => setSelectedProject(null)}>
        {selectedProject ? (
          <div className="space-y-3 text-sm text-muted">
            <p className="text-base font-semibold text-white">{selectedProject.description}</p>
            <p>{selectedProject.detail}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedProject.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </>
  );
}

export default App;
