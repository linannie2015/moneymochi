'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase keys aren't set, the app still runs (demo / localStorage mode).
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Restore an existing session on page load
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for login / logout happening anywhere in the app
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Login is not set up yet.', needsConfirmation: false };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsConfirmation: false };
    // If "Confirm email" is ON in Supabase, there's no session until they confirm.
    // If it's OFF, they're logged in immediately (session present).
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Login is not set up yet.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, configured: !!supabase, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
