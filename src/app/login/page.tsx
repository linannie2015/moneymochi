'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { signIn, signUp, configured } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setBusy(false);
      if (error) { setMsg({ type: 'error', text: error }); return; }
      router.push('/');
    } else {
      const { error, needsConfirmation } = await signUp(email, password);
      setBusy(false);
      if (error) { setMsg({ type: 'error', text: error }); return; }
      if (needsConfirmation) {
        setMsg({ type: 'info', text: '🎉 Account created! Check your email to confirm, then sign in.' });
        setMode('signin');
        setPassword('');
      } else {
        router.push('/');
      }
    }
  }

  return (
    <div className="max-w-[420px] mx-auto mt-6 animate-slide-up">
      <div className="text-center mb-6">
        <img src="/logo-dango.svg" alt="" className="h-16 w-auto mx-auto mb-3 animate-float" />
        <h1 className="text-2xl mb-1">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="text-muted text-sm">
          {mode === 'signin'
            ? 'Sign in to see your watchlist, portfolio, and alerts on any device.'
            : 'One account keeps your watchlist, portfolio, and alerts synced everywhere.'}
        </p>
      </div>

      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6">
        {!configured && (
          <div className="bg-sun-soft border border-sun rounded-[var(--r-sm)] p-3 mb-4 text-sm text-[#A06A00]">
            Login isn&apos;t connected yet. Add your Supabase keys to <strong>.env.local</strong> and restart.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-heading font-semibold text-[0.72rem] uppercase tracking-wider text-muted">Email</span>
            <span className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-line rounded-xl bg-cream
                           font-body text-sm outline-none focus:border-peach transition-colors"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-heading font-semibold text-[0.72rem] uppercase tracking-wider text-muted">Password</span>
            <span className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2.5 border-2 border-line rounded-xl bg-cream
                           font-body text-sm outline-none focus:border-peach transition-colors"
              />
            </span>
          </label>

          {msg && (
            <div className={`rounded-[var(--r-sm)] p-3 text-sm ${
              msg.type === 'error' ? 'bg-peach-soft text-[#B0492F]' : 'bg-mint-soft text-[#1E7A55]'
            }`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !configured}
            className="font-heading font-semibold bg-peach text-white border-none rounded-xl px-4 py-3 mt-1
                       cursor-pointer hover:bg-coral transition-colors flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-muted">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null); }}
            className="font-heading font-semibold text-peach hover:text-coral border-none bg-transparent cursor-pointer"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted mt-4">
        <Link href="/" className="text-muted hover:text-ink no-underline">← Back to home</Link>
      </p>
    </div>
  );
}
