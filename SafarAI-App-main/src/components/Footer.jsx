import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import Icon from './ui/Icon';
import Button from './ui/Button';
import { Input } from './ui/Input';
import { footerColumns } from '../config/navigation';
import { useToast } from '../context/ToastContext';

const socials = [
  { label: 'LinkedIn', icon: 'users', href: 'https://www.linkedin.com' },
  { label: 'X', icon: 'zap', href: 'https://x.com' },
  { label: 'Instagram', icon: 'camera', href: 'https://instagram.com' },
];

function Footer() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const onSubscribe = (event) => {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!valid) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      toast.success('You are on the list', {
        description: 'Weekly destination intel and price drops, no spam.',
      });
    }, 700);
  };

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl dark:bg-accent-500/10"
      />

      <div className="content-grid relative py-14">
        {/* CTA band */}
        <div className="mb-14 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 p-8 shadow-lift sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-2xs font-bold uppercase tracking-[0.24em] text-white/70">Ready when you are</p>
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                Get a complete, day-by-day trip plan in under a minute.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
                Tell SafarAI where and when. We handle the itinerary, budget, stays, transport and safety notes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button to="/trip-planner" variant="glass" leadingIcon="sparkles">
                  Start planning
                </Button>
                <Button to="/explore" variant="glass" trailingIcon="arrowRight">
                  Browse destinations
                </Button>
              </div>
            </div>

            <form onSubmit={onSubscribe} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <label htmlFor="footer-email" className="text-sm font-semibold text-white">
                Travel intel, weekly
              </label>
              <p className="mt-1 text-xs text-white/70">Seasonal price drops, new routes and safety updates.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status !== 'idle') setStatus('idle');
                  }}
                  placeholder="you@example.com"
                  className="border-white/25 bg-white/15 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/20"
                  aria-invalid={status === 'error'}
                />
                <Button type="submit" variant="glass" loading={status === 'loading'} className="shrink-0">
                  {status === 'success' ? 'Subscribed' : 'Subscribe'}
                </Button>
              </div>
              {status === 'error' && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-100">
                  <Icon name="alert" size="xs" /> Enter a valid email address.
                </p>
              )}
              {status === 'success' && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-100">
                  <Icon name="checkCircle" size="xs" /> You are subscribed.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-fg-muted">
              AI-guided travel planning for safer, smarter journeys — destination intelligence, itinerary tools,
              live budgets and railway-focused assistance in one workspace.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-muted text-fg-muted transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-sm"
                >
                  <Icon name={social.icon} size="sm" />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-fg-subtle">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-300"
                    >
                      <span className="h-px w-0 bg-brand-500 transition-all duration-200 group-hover:w-3" />
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-fg-subtle">© {new Date().getFullYear()} SafarAI · A TravelCore Product</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-fg-subtle">
            <Link to="/safety" className="transition hover:text-fg">
              Safety
            </Link>
            <Link to="/community" className="transition hover:text-fg">
              Community
            </Link>
            <Link to="/profile" className="transition hover:text-fg">
              Dashboard
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
