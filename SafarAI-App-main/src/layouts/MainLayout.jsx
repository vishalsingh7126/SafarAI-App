import { Suspense, lazy, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommandPalette from '../components/CommandPalette';
import Icon from '../components/ui/Icon';
import { useAssistant } from '../context/AssistantContext';
import { cn } from '../lib/cn';

/**
 * The assistant (and its markdown renderer) is the heaviest optional feature,
 * so it is code-split and only mounted once the user asks for it — or after
 * the browser goes idle.
 */
const TravelAssistantChat = lazy(() => import('../components/TravelAssistantChat'));

function AssistantLauncher({ onClick }) {
  return (
    <div className="fixed bottom-4 right-4 z-[95] sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={onClick}
        aria-label="Open SafarAI assistant"
        className="group relative inline-flex items-center gap-2.5 rounded-full bg-brand-gradient py-3 pl-3 pr-4 text-sm font-bold text-white shadow-glow transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:shadow-lift"
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-brand-500/45 animate-pulse-ring" aria-hidden="true" />
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Icon name="sparkles" size="sm" />
        </span>
        <span className="hidden sm:inline">Ask SafarAI</span>
      </button>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-4 left-4 z-[92] inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-fg-muted shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-600 sm:bottom-6 sm:left-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <Icon name="chevronUp" size="md" />
    </button>
  );
}

function MainLayout() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [assistantMounted, setAssistantMounted] = useState(false);
  const { dockOpen, openDock } = useAssistant();

  // Mount the assistant as soon as any surface requests it.
  useEffect(() => {
    if (dockOpen) setAssistantMounted(true);
  }, [dockOpen]);

  // Warm the chunk when the browser is idle so the first open feels instant.
  useEffect(() => {
    const preload = () => import('../components/TravelAssistantChat');
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(preload, 3500);
    return () => clearTimeout(id);
  }, []);

  // Global ⌘K / Ctrl+K (and "/") shortcut for search
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !/input|textarea|select/i.test(event.target?.tagName || '') &&
        !event.target?.isContentEditable
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const showAssistant = location.pathname !== '/assistant';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onOpenCommand={() => setCommandOpen(true)} />

      <main
        id="main-content"
        key={location.pathname}
        className={cn('flex-1 animate-fade-in', isHome ? 'pb-0 pt-2' : 'content-grid pb-10 pt-6 sm:pt-8')}
      >
        <Outlet />
      </main>

      <Footer />

      {showAssistant &&
        (assistantMounted ? (
          <Suspense fallback={<AssistantLauncher onClick={() => {}} />}>
            <TravelAssistantChat />
          </Suspense>
        ) : (
          <AssistantLauncher
            onClick={() => {
              setAssistantMounted(true);
              openDock();
            }}
          />
        ))}

      <BackToTop />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}

export default MainLayout;
