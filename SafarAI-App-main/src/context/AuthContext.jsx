import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * AuthContext — single subscription to the existing Supabase session
 * (previously duplicated inside Navbar).
 *
 * The Supabase client is imported dynamically so its ~45 kB never blocks
 * first paint; behaviour is otherwise identical (same client, same
 * onAuthStateChange listener, same signOut call).
 */
const AuthContext = createContext({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef(null);

  useEffect(() => {
    let active = true;
    let subscription;

    import('../services/supabase')
      .then(async ({ supabase }) => {
        if (!active) return;
        clientRef.current = supabase;

        try {
          const { data } = await supabase.auth.getSession();
          if (active) setUser(data?.session?.user ?? null);
        } catch {
          /* offline or misconfigured project — stay signed out */
        } finally {
          if (active) setLoading(false);
        }

        const listener = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        subscription = listener?.data?.subscription;
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      const client = clientRef.current || (await import('../services/supabase')).supabase;
      await client.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      displayName:
        user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Traveller',
      signOut,
    }),
    [user, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
