'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { sendCode, verifyCode, configured } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const { error } = await sendCode(email);
    setBusy(false);
    if (error) { setMsg({ type: 'error', text: error }); return; }
    setStep('code');
    setMsg({ type: 'info', text: `We sent a 6-digit code to ${email}. Check your inbox!` });
    setTimeout(() => codeRef.current?.focus(), 100);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const { error } = await verifyCode(email, code);
    setBusy(false);
    if (error) { setMsg({ type: 'error', text: 'That code didn\'t work. Double-check it or resend.' }); return; }
    router.push('/');
  }

  return (
    <div className="max-w-[420px] mx-auto mt-6 animate-slide-up">
      <div className="text-center mb-6">
        <img src="/logo-dango.svg" alt="" className="h-16 w-auto mx-auto mb-3 animate-float" />
        <h1 className="text-2xl mb-1">{step === 'email' ? 'Sign in to MoneyMochi' : 'Enter your code'}</h1>
        <p className="text-muted text-sm">
          {step === 'email'
            ? 'No password needed — we\'ll email you a 6-digit code.'
            : 'Pop in the 6-digit code we just emailed you.'}
        </p>
      </div>

      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6">
        {!configured && (
          <div className="bg-sun-soft border border-sun rounded-[var(--r-sm)] p-3 mb-4 text-sm text-[#A06A00]">
            Login isn&apos;t connected yet. Add your Supabase keys to <strong>.env.local</strong> and restart.
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
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
              Send me a code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-heading font-semibold text-[0.72rem] uppercase tracking-wider text-muted">6-digit code</span>
              <input
                ref={codeRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3 py-3 border-2 border-line rounded-xl bg-cream text-center
                           font-heading font-bold text-2xl tracking-[0.4em] outline-none focus:border-peach transition-colors"
              />
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
              disabled={busy || code.length < 6}
              className="font-heading font-semibold bg-peach text-white border-none rounded-xl px-4 py-3 mt-1
                         cursor-pointer hover:bg-coral transition-colors flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Verify &amp; sign in
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setMsg(null); }}
              className="font-heading font-semibold text-sm text-muted hover:text-ink border-none bg-transparent
                         cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <ArrowLeft size={14} /> Use a different email
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-muted mt-4">
        <Link href="/" className="text-muted hover:text-ink no-underline">← Back to home</Link>
      </p>
    </div>
  );
}
