import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import BrandLogo from '../components/BrandLogo';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';

/* ---------------------------------------------------------------- brand SVGs */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.32-2 3.03l3.24 2.51c1.89-1.74 2.98-4.3 2.98-7.34 0-.71-.06-1.39-.18-2.05H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.51c-.9.6-2.06.95-3.39.95-2.6 0-4.8-1.75-5.58-4.1H3.08v2.58A10 10 0 0012 22z" />
      <path fill="#4A90E2" d="M6.42 13.9A5.98 5.98 0 016.1 12c0-.66.11-1.3.32-1.9V7.52H3.08A10 10 0 002 12c0 1.63.39 3.16 1.08 4.48l3.34-2.58z" />
      <path fill="#FBBC05" d="M12 5.95c1.47 0 2.78.5 3.82 1.49l2.86-2.86C16.97 2.99 14.7 2 12 2A10 10 0 003.08 7.52L6.42 10.1C7.2 7.7 9.4 5.95 12 5.95z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M16.9 12.62c.02 2.37 2.08 3.16 2.1 3.17-.02.05-.33 1.14-1.09 2.25-.66.95-1.35 1.89-2.43 1.91-1.06.02-1.41-.63-2.63-.63-1.23 0-1.61.61-2.6.65-1.04.04-1.84-1.04-2.5-1.98-1.35-1.96-2.39-5.53-1-7.95.69-1.2 1.93-1.95 3.27-1.97 1.02-.02 1.99.69 2.63.69.65 0 1.86-.85 3.13-.72.53.02 2.03.21 3 1.63-.08.05-1.79 1.05-1.78 2.95zm-2.79-6.43c.55-.67.92-1.59.82-2.52-.79.03-1.75.53-2.31 1.2-.51.6-.95 1.55-.83 2.46.88.07 1.77-.45 2.32-1.14z" />
    </svg>
  );
}

const sliderSlides = [
  {
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=75',
    alt: 'Mountain road trip landscape',
    quote: 'Capturing moments, creating memories',
    caption: 'Plan 12 destinations with real budgets and safety scores',
  },
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=75',
    alt: 'Tropical beach destination',
    quote: 'Every coastline, costed honestly',
    caption: 'Season-aware pricing so there are no surprises',
  },
  {
    src: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=75',
    alt: 'City travel cultural destination',
    quote: 'Know the city before you land',
    caption: 'Food, culture and transport intel in one workspace',
  },
];

/* -------------------------------------------------------------------- field */

function FloatingField({ id, label, type = 'text', value, onChange, required, autoComplete, trailing, error }) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder=" "
          aria-invalid={Boolean(error)}
          className={cn(
            'peer w-full rounded-xl border bg-white/5 px-4 pb-2 pt-6 text-[15px] text-white outline-none transition',
            'placeholder-transparent focus:ring-4 focus:ring-brand-400/20',
            error ? 'border-rose-400/70 focus:border-rose-400' : 'border-white/15 focus:border-brand-300',
            trailing && 'pr-12'
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-4 top-2 text-2xs font-semibold uppercase tracking-wide transition-all duration-200',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-[15px] peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-slate-400',
            'peer-focus:top-2 peer-focus:text-2xs peer-focus:uppercase peer-focus:tracking-wide peer-focus:text-brand-300',
            error ? 'text-rose-300' : 'text-slate-400'
          )}
        >
          {label}
        </label>
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300">
          <Icon name="alert" size="xs" />
          {error}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- page */

function AuthPage() {
  usePageMeta('Sign in | SafarAI', 'Create an account or log in to SafarAI.');

  const navigate = useNavigate();
  const toast = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const passwordLength = formValues.password.length;
  const passwordStrength = useMemo(() => {
    if (passwordLength === 0) return { label: '', level: 0, tone: 'bg-slate-600', text: 'text-slate-400' };
    if (passwordLength < 6) return { label: 'Weak', level: 1, tone: 'bg-rose-400', text: 'text-rose-300' };
    if (passwordLength < 10) return { label: 'Medium', level: 2, tone: 'bg-amber-400', text: 'text-amber-300' };
    return { label: 'Strong', level: 3, tone: 'bg-emerald-400', text: 'text-emerald-300' };
  }, [passwordLength]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formValues.email.trim());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderSlides.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  /* ---- Supabase handlers (behaviour preserved) --------------------------- */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setTouched({ email: true, password: true, firstName: true, lastName: true });

    if (!formValues.email || !formValues.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!isLogin && (!formValues.firstName || !formValues.lastName)) {
      setErrorMessage('Please enter your first and last name.');
      return;
    }

    if (!isLogin && !agreed) {
      setErrorMessage('You must agree to the Terms & Conditions.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formValues.email,
          password: formValues.password,
        });

        if (error) throw error;

        setSuccessMessage('Logged in successfully! Redirecting...');
        toast.success('Welcome back to SafarAI');
        setTimeout(() => navigate('/'), 1200);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formValues.email,
          password: formValues.password,
          options: {
            data: {
              first_name: formValues.firstName,
              last_name: formValues.lastName,
            },
          },
        });

        if (error) throw error;

        if (data?.user && data?.session === null) {
          setSuccessMessage('Registration successful! Please check your email to verify your account.');
          toast.info('Verify your email', { description: 'We sent you a confirmation link.' });
        } else {
          setSuccessMessage('Account created and logged in successfully! Redirecting...');
          toast.success('Account created');
          setTimeout(() => navigate('/'), 1200);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during authentication.');
      toast.error('Authentication failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setErrorMessage('');
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message || `Failed to log in with ${provider}.`);
      toast.error(`Could not continue with ${provider}`);
    } finally {
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#151329] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:min-h-[42rem] lg:grid-cols-[1.05fr_1fr]">
        {/* ------------------------------------------------------- showcase */}
        <section className="relative hidden overflow-hidden lg:block">
          {sliderSlides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-smooth',
                activeSlide === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
              )}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-700/45 via-slate-950/50 to-slate-950/92" />
          <div className="absolute inset-0 bg-hero-grid bg-[size:22px_22px] opacity-10" />

          <div className="absolute inset-x-8 top-7 flex items-start justify-between">
            <BrandLogo inverted />
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              Back to website
              <Icon name="arrowRight" size="sm" />
            </Link>
          </div>

          <div className="absolute inset-x-8 bottom-8">
            <p className="max-w-md text-[2.6rem] font-light leading-[1.1] text-white/95">
              {sliderSlides[activeSlide].quote}
            </p>
            <p className="mt-3 max-w-sm text-sm text-white/70">{sliderSlides[activeSlide].caption}</p>

            <div className="mt-7 flex items-center gap-2">
              {sliderSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    activeSlide === index ? 'w-10 bg-white' : 'w-5 bg-white/35 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- form */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[26.5rem] text-white">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <BrandLogo inverted />
              <Link to="/" className="text-sm font-medium text-brand-300 hover:underline">
                Back
              </Link>
            </div>

            {/* segmented switch */}
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              {[
                { value: true, label: 'Log in' },
                { value: false, label: 'Sign up' },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setIsLogin(option.value);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  aria-pressed={isLogin === option.value}
                  className={cn(
                    'rounded-full py-2 text-sm font-semibold transition-all duration-300',
                    isLogin === option.value ? 'bg-brand-gradient text-white shadow-float' : 'text-slate-300 hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-white">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin
                ? 'Log in to sync your trips, saved places and preferences.'
                : 'Start planning in under a minute — no credit card, no spam.'}
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-slide-down"
              >
                <Icon name="alert" size="sm" className="mt-0.5 shrink-0" />
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 animate-slide-down"
              >
                <Icon name="checkCircle" size="sm" className="mt-0.5 shrink-0" />
                {successMessage}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FloatingField
                    id="firstName"
                    label="First name"
                    autoComplete="given-name"
                    value={formValues.firstName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, firstName: event.target.value }))}
                    error={touched.firstName && !formValues.firstName ? 'Required' : ''}
                    required
                  />
                  <FloatingField
                    id="lastName"
                    label="Last name"
                    autoComplete="family-name"
                    value={formValues.lastName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, lastName: event.target.value }))}
                    error={touched.lastName && !formValues.lastName ? 'Required' : ''}
                    required
                  />
                </div>
              )}

              <FloatingField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={formValues.email}
                onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                error={touched.email && formValues.email && !emailValid ? 'Enter a valid email address' : ''}
                required
              />

              <div>
                <FloatingField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formValues.password}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <Icon name="eye" size="sm" />
                    </button>
                  }
                />

                {!isLogin && passwordLength > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors duration-300',
                            level <= passwordStrength.level ? passwordStrength.tone : 'bg-white/12'
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn('text-2xs font-bold', passwordStrength.text)}>{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-500"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-brand-300">Terms &amp; Conditions</span> and{' '}
                    <span className="font-semibold text-brand-300">Privacy Policy</span>.
                  </span>
                </label>
              )}

              <Button type="submit" size="lg" fullWidth loading={loading} leadingIcon={loading ? undefined : isLogin ? 'login' : 'sparkles'}>
                {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">or continue with</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={Boolean(oauthLoading)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:opacity-60"
              >
                {oauthLoading === 'google' ? <Icon name="refresh" size="sm" className="animate-spin" /> : <GoogleIcon />}
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                disabled={Boolean(oauthLoading)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:opacity-60"
              >
                {oauthLoading === 'apple' ? <Icon name="refresh" size="sm" className="animate-spin" /> : <AppleIcon />}
                Apple
              </button>
            </div>

            <p className="mt-7 text-center text-xs text-slate-400">
              {isLogin ? 'New to SafarAI? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-semibold text-brand-300 underline-offset-2 hover:underline"
              >
                {isLogin ? 'Create an account' : 'Log in instead'}
              </button>
            </p>

            <p className="mt-4 text-center text-2xs text-slate-500">
              You can also{' '}
              <Link to="/trip-planner" className="font-semibold text-slate-300 underline-offset-2 hover:underline">
                keep planning as a guest
              </Link>{' '}
              — trips stay on this device.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
