import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import Icon from './ui/Icon';
import Button from './ui/Button';
import { cn } from '../lib/cn';
import { navGroups, primaryLinks } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import useOnClickOutside from '../hooks/useOnClickOutside';

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? (window.scrollY / height) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 h-px bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-brand-gradient transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function MegaMenu({ group, open, onOpen, onClose }) {
  const location = useLocation();
  const groupActive = group.items.some((item) => location.pathname === item.to);

  return (
    <li
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? onClose() : onOpen())}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200',
          groupActive || open
            ? 'bg-surface-muted text-brand-700 dark:text-brand-200'
            : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
        )}
      >
        {group.label}
        <Icon
          name="chevronDown"
          size="xs"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'absolute left-1/2 top-full z-50 w-[26rem] -translate-x-1/2 pt-3 transition-all duration-200',
          open ? 'visible opacity-100 translate-y-0' : 'invisible -translate-y-1 opacity-0'
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-raised p-2 shadow-lift">
          <p className="px-3 pb-1 pt-2 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
            {group.description}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150',
                  isActive ? 'bg-brand-50 dark:bg-brand-500/12' : 'hover:bg-surface-muted'
                )
              }
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-150 group-hover:bg-brand-gradient group-hover:text-white dark:bg-brand-500/12 dark:text-brand-300">
                <Icon name={item.icon} size="sm" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-accent-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-accent-700 dark:bg-accent-500/20 dark:text-accent-200">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-fg-muted">{item.description}</span>
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </li>
  );
}

function UserMenu({ onCommand }) {
  const { user, displayName, signOut } = useAuth();
  const { favourites, trips } = useWorkspace();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button to="/auth" variant="secondary" size="sm" className="hidden sm:inline-flex">
          Log in
        </Button>
        <Button to="/trip-planner" size="sm" leadingIcon="sparkles">
          <span className="hidden sm:inline">Plan a trip</span>
          <span className="sm:hidden">Plan</span>
        </Button>
      </div>
    );
  }

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-fg sm:block">{displayName}</span>
        <Icon name="chevronDown" size="xs" className={cn('text-fg-subtle transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface-raised p-2 shadow-lift animate-slide-down"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold text-fg">{displayName}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-fg-muted">
                {trips.length} trips
              </span>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-fg-muted">
                {favourites.length} saved
              </span>
            </div>
          </div>

          {[
            { to: '/profile', label: 'Dashboard', icon: 'chart' },
            { to: '/my-trips', label: 'My trips', icon: 'luggage' },
            { to: '/assistant', label: 'AI assistant', icon: 'bot' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <Icon name={item.icon} size="sm" />
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCommand?.();
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
          >
            <span className="flex items-center gap-3">
              <Icon name="search" size="sm" />
              Search everything
            </span>
            <kbd className="rounded border border-line bg-surface px-1.5 text-2xs font-semibold">⌘K</kbd>
          </button>

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              try {
                await signOut();
                toast.success('Signed out', { description: 'See you on the next journey.' });
              } catch {
                toast.error('Could not sign out', { description: 'Please try again in a moment.' });
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Icon name="logout" size="sm" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileDrawer({ open, onClose, onCommand }) {
  const { user, displayName, signOut } = useAuth();
  const { trips, favourites } = useWorkspace();
  const [expanded, setExpanded] = useState('plan');

  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div
      className={cn('fixed inset-0 z-[100] lg:hidden', open ? 'visible' : 'invisible pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-line bg-surface shadow-lift transition-transform duration-300 ease-smooth',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <BrandLogo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-fg-subtle transition hover:bg-surface-muted hover:text-fg"
            aria-label="Close menu"
          >
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="border-b border-line p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCommand?.();
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-3 text-sm text-fg-subtle transition hover:border-brand-300"
          >
            <Icon name="search" size="sm" />
            Search destinations, stays, food…
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {primaryLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                  isActive ? 'bg-brand-gradient text-white shadow-float' : 'text-fg-muted hover:bg-surface-muted'
                )
              }
            >
              <Icon name={item.icon} size="sm" />
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-line" />

          {navGroups.map((group) => {
            const isOpen = expanded === group.id;
            return (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : group.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-fg transition hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-3">
                    <Icon name={group.icon} size="sm" className="text-brand-500" />
                    {group.label}
                  </span>
                  <Icon
                    name="chevronDown"
                    size="sm"
                    className={cn('text-fg-subtle transition-transform duration-300', isOpen && 'rotate-180')}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-smooth',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pb-2 pl-4">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                              isActive
                                ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/12 dark:text-brand-200'
                                : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
                            )
                          }
                        >
                          <Icon name={item.icon} size="sm" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          {user ? (
            <div className="space-y-3">
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-fg">{displayName}</span>
                  <span className="block text-xs text-fg-muted">
                    {trips.length} trips · {favourites.length} saved
                  </span>
                </span>
              </Link>
              <Button
                variant="dangerSoft"
                fullWidth
                leadingIcon="logout"
                onClick={async () => {
                  onClose();
                  await signOut().catch(() => {});
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button to="/auth" variant="secondary" onClick={onClose} fullWidth>
                Log in
              </Button>
              <Button to="/trip-planner" onClick={onClose} fullWidth>
                Plan trip
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Navbar({ onOpenCommand }) {
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { favourites } = useWorkspace();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpenGroup(null);
    setDrawerOpen(false);
  }, [location.pathname]);

  const closeGroup = useCallback(() => setOpenGroup(null), []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'sticky top-0 z-[90] transition-all duration-300',
          scrolled ? 'border-b border-line glass shadow-sm' : 'border-b border-transparent bg-transparent'
        )}
      >
        <nav className="content-grid flex h-[var(--nav-h)] items-center justify-between gap-2 xl:gap-4" aria-label="Main">
          <Link to="/" className="shrink-0" aria-label="SafarAI home">
            <BrandLogo />
          </Link>

          <ul className="hidden min-w-0 flex-nowrap items-center gap-0.5 overflow-hidden lg:flex xl:gap-1">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'bg-surface-muted text-brand-700 dark:text-brand-200'
                      : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
                  )
                }
              >
                Home
              </NavLink>
            </li>

            {navGroups.map((group) => (
              <MegaMenu
                key={group.id}
                group={group}
                open={openGroup === group.id}
                onOpen={() => setOpenGroup(group.id)}
                onClose={closeGroup}
              />
            ))}

            <li className="hidden 2xl:block">
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'bg-surface-muted text-brand-700 dark:text-brand-200'
                      : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
                  )
                }
              >
                Community
              </NavLink>
            </li>
          </ul>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenCommand}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs font-medium text-fg-subtle shadow-xs transition hover:border-brand-300 hover:text-fg xl:inline-flex"
              aria-label="Open search (Command K)"
            >
              <Icon name="search" size="sm" />
              <span className="hidden lg:inline">Search…</span>
              <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-2xs font-bold">⌘K</kbd>
            </button>

            <Link
              to="/profile?tab=saved"
              className="relative hidden rounded-full border border-line bg-surface p-2 text-fg-muted shadow-xs transition hover:border-brand-300 hover:text-brand-600 sm:inline-flex"
              aria-label={`Saved items (${favourites.length})`}
            >
              <Icon name="heart" size="sm" />
              {favourites.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {favourites.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-line bg-surface p-2 text-fg-muted shadow-xs transition hover:border-brand-300 hover:text-brand-600"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size="sm" />
            </button>

            <div className="hidden lg:block">
              <UserMenu onCommand={onOpenCommand} />
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-full border border-line bg-surface p-2 text-fg shadow-xs transition hover:border-brand-300 lg:hidden"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Icon name="menu" size="md" />
            </button>
          </div>
        </nav>

        {scrolled && <ScrollProgress />}
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onCommand={onOpenCommand} />
    </>
  );
}

export default Navbar;
