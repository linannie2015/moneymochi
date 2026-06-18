'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Mail, ShieldCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AccountPage() {
  const { user, loading, configured, signOut } = useAuth();
  const router = useRouter();

  // If not logged in, send them to the sign-in page
  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace('/login');
    }
  }, [configured, loading, user, router]);

  if (!configured) {
    return (
      <div className="max-w-[520px] mx-auto mt-10 text-center text-muted">
        Login isn&apos;t connected yet. Add your Supabase keys to <strong>.env.local</strong> and restart.
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="grid place-items-center py-32 text-muted">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const initial = (user.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="max-w-[560px] mx-auto mt-6 animate-slide-up">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-xl">⚙️</span>
        <h1 className="text-xl">Your account</h1>
      </div>
      <p className="text-muted mb-5 text-sm">Manage your MoneyMochi account and sign out of this device.</p>

      {/* Profile card */}
      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <span className="grid place-items-center w-16 h-16 rounded-full bg-lav-soft text-[#6B4FA0] font-heading font-bold text-2xl flex-none">
            {initial}
          </span>
          <div className="min-w-0">
            <div className="font-heading font-bold text-lg truncate">{user.email}</div>
            <div className="text-muted text-sm">Signed in</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3 py-2 border-t border-line">
            <Mail size={16} className="text-muted flex-none" />
            <span className="text-muted">Email</span>
            <span className="ml-auto font-heading font-semibold truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 py-2 border-t border-line">
            <ShieldCheck size={16} className="text-muted flex-none" />
            <span className="text-muted">Sign-in method</span>
            <span className="ml-auto font-heading font-semibold">Email &amp; password</span>
          </div>
          {createdAt && (
            <div className="flex items-center gap-3 py-2 border-t border-line">
              <CalendarDays size={16} className="text-muted flex-none" />
              <span className="text-muted">Member since</span>
              <span className="ml-auto font-heading font-semibold">
                {createdAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6">
        <button
          onClick={async () => { await signOut(); router.push('/'); }}
          className="w-full font-heading font-semibold text-sm border-2 border-line bg-card rounded-xl px-4 py-3
                     hover:border-peach hover:bg-peach-soft hover:text-[#B0492F] transition-all
                     flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <p className="text-center text-xs text-muted mt-4">
        <Link href="/" className="text-muted hover:text-ink no-underline">← Back to watchlist</Link>
      </p>
    </div>
  );
}
