import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.32-2 3.03l3.24 2.51c1.89-1.74 2.98-4.3 2.98-7.34 0-.71-.06-1.39-.18-2.05H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.51c-.9.6-2.06.95-3.39.95-2.6 0-4.8-1.75-5.58-4.1H3.08v2.58A10 10 0 0012 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.42 13.9A5.98 5.98 0 016.1 12c0-.66.11-1.3.32-1.9V7.52H3.08A10 10 0 002 12c0 1.63.39 3.16 1.08 4.48l3.34-2.58z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.95c1.47 0 2.78.5 3.82 1.49l2.86-2.86C16.97 2.99 14.7 2 12 2A10 10 0 003.08 7.52L6.42 10.1C7.2 7.7 9.4 5.95 12 5.95z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
      <path d="M16.9 12.62c.02 2.37 2.08 3.16 2.1 3.17-.02.05-.33 1.14-1.09 2.25-.66.95-1.35 1.89-2.43 1.91-1.06.02-1.41-.63-2.63-.63-1.23 0-1.61.61-2.6.65-1.04.04-1.84-1.04-2.5-1.98-1.35-1.96-2.39-5.53-1-7.95.69-1.2 1.93-1.95 3.27-1.97 1.02-.02 1.99.69 2.63.69.65 0 1.86-.85 3.13-.72.53.02 2.03.21 3 1.63-.08.05-1.79 1.05-1.78 2.95zm-2.79-6.43c.55-.67.92-1.59.82-2.52-.79.03-1.75.53-2.31 1.2-.51.6-.95 1.55-.83 2.46.88.07 1.77-.45 2.32-1.14z" />
    </svg>
  );
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-slate-400" fill="none" strokeWidth="1.8" aria-hidden="true">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-slate-400" fill="none" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 004.2 4.2" />
      <path d="M9.9 5.1A10.9 10.9 0 0112 5c6.5 0 10 7 10 7a17.6 17.6 0 01-3.1 3.7" />
      <path d="M6.2 6.2A17.6 17.6 0 002 12s3.5 7 10 7a10.9 10.9 0 005-.9" />
    </svg>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#4b4562] bg-[#3a3550]/75 px-4 py-3 text-[15px] text-white placeholder:text-slate-400 outline-none transition focus:border-[#7f73d4] focus:ring-2 focus:ring-[#7f73d4]/30';

const floatingInputClass =
  'peer w-full rounded-xl border border-[#4b4562] bg-[#3a3550]/75 px-4 pb-2 pt-5 text-[15px] text-white placeholder-transparent outline-none transition focus:border-[#7f73d4] focus:ring-2 focus:ring-[#7f73d4]/30';

const sliderImages = [
  {
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
    alt: 'Mountain road trip landscape',
  },
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Tropical beach destination',
  },
  {
    src: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80',
    alt: 'City travel cultural destination',
  },
];

import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function AuthPage() {
  usePageMeta('Auth | SafarAI', 'Create an account or log in to SafarAI.');
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const passwordLength = formValues.password.length;
  const passwordStrength =
    passwordLength < 6
      ? { label: 'Weak', color: 'text-red-400', level: 2, dot: 'bg-red-400' }
      : passwordLength < 10
      ? { label: 'Medium', color: 'text-yellow-400', level: 3, dot: 'bg-yellow-400' }
      : { label: 'Strong', color: 'text-emerald-400', level: 4, dot: 'bg-emerald-400' };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formValues.email,
          password: formValues.password,
        });

        if (error) throw error;

        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Sign Up
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

        // If email confirmation is enabled, user needs to check email
        if (data?.user && data?.session === null) {
          setSuccessMessage('Registration successful! Please check your email to verify your account.');
        } else {
          setSuccessMessage('Account created and logged in successfully! Redirecting...');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message || `Failed to log in with ${provider}.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#201d2f] px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto grid w-full max-w-[1150px] overflow-hidden rounded-2xl bg-[#2a273b] shadow-[0_30px_80px_-30px_rgba(5,4,12,0.85)] lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden lg:block">
          {sliderImages.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                activeSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#453d9f]/45 via-[#2b2358]/45 to-[#160f2b]/88" />

          <div className="absolute left-8 right-8 top-6 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-[0.02em] text-white">SafarAI</p>
              <p className="mt-1 text-xs font-medium tracking-[0.08em] text-white/80">A TravelCore Product</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Back to website
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="absolute bottom-8 left-8 right-8">
            <p className="max-w-sm text-[48px] font-light leading-[1.1] text-white/95">
              Capturing Moments,
              <br />
              Creating Memories
            </p>
            <div className="mt-7 flex items-center gap-3">
              {sliderImages.map((image, index) => (
                <span
                  key={image.src}
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${
                    activeSlide === index ? 'bg-white' : 'bg-white/35'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-full max-w-[430px] text-white">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {isLogin ? 'Log in to SafarAI' : 'Create an account'}
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-medium text-[#b3a8ff] underline-offset-2 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <input
                      className={floatingInputClass}
                      type="text"
                      placeholder=" "
                      value={formValues.firstName}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, firstName: event.target.value }))}
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-2 text-xs text-slate-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#b3a8ff]">
                      First Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      className={floatingInputClass}
                      type="text"
                      placeholder=" "
                      value={formValues.lastName}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, lastName: event.target.value }))}
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-2 text-xs text-slate-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#b3a8ff]">
                      Last Name
                    </label>
                  </div>
                </div>
              )}

              <div className="relative">
                <input
                  className={floatingInputClass}
                  type="email"
                  placeholder=" "
                  value={formValues.email}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <label className="pointer-events-none absolute left-4 top-2 text-xs text-slate-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#b3a8ff]">
                  Email
                </label>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    className={`${floatingInputClass} pr-12`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder=" "
                    value={formValues.password}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                  <label className="pointer-events-none absolute left-4 top-2 text-xs text-slate-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#b3a8ff]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 inline-flex items-center"
                    aria-label="Toggle password visibility"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
                {!isLogin && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      Password strength:{' '}
                      <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {Array.from({ length: 4 }, (_, index) => (
                        <span
                          key={index}
                          className={`h-2 w-2 rounded-full ${
                            index < passwordStrength.level ? passwordStrength.dot : 'bg-slate-500/60'
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <label className="mt-1 flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="h-5 w-5 rounded border-[#524a73] bg-[#f8f8fb] accent-[#7f73d4]"
                  />
                  <span>
                    I agree to the{' '}
                    <button type="button" className="text-slate-200 underline underline-offset-2 hover:text-white">
                      Terms &amp; Conditions
                    </button>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-[#6d58d5] to-[#745fd9] px-5 py-3.5 text-lg font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isLogin ? 'Log in' : 'Create account'}
              </button>

              <div className="relative py-2 text-center">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#4a4463]" />
                <span className="relative z-10 bg-[#2a273b] px-4 text-sm text-slate-400">
                  {isLogin ? 'Or sign in with' : 'Or register with'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5a5475] bg-transparent px-4 py-3 text-base font-semibold text-white transition hover:bg-white/5"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('apple')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5a5475] bg-transparent px-4 py-3 text-base font-semibold text-white transition hover:bg-white/5"
                >
                  <AppleIcon />
                  Apple
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
