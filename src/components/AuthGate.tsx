'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Pages anyone can see without being logged in.
const PUBLIC_PATHS = ['/', '/login', '/terms'];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  // A logged-out visitor trying to open a protected page
  const blocked = configured && !loading && !user && !isPublic;

  useEffect(() => {
    if (blocked) router.replace('/login');
  }, [blocked, router]);

  // While we're checking the session on a protected page, show a gentle loader
  // (prevents the page from flashing before login is confirmed).
  if (configured && loading && !isPublic) {
    return (
      <div className="grid place-items-center py-32 text-muted">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  // Don't render protected content for logged-out visitors (redirect is in flight)
  if (blocked) return null;

  return <>{children}</>;
}
