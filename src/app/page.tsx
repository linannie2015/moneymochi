'use client';

import { Loader2 } from 'lucide-react';
import WatchlistTable from '@/components/WatchlistTable';
import PortfolioSummary from '@/components/PortfolioSummary';
import Landing from '@/components/Landing';
import { useWatchlist } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, loading, configured } = useAuth();
  const { stocks, addStock, removeStock } = useWatchlist();

  // While we check if someone is logged in, show a gentle loader
  if (configured && loading) {
    return (
      <div className="grid place-items-center py-32 text-muted">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  // Visitors who aren't signed in see the welcome landing page
  if (configured && !user) {
    return <Landing />;
  }

  // Signed-in users (or demo mode without Supabase) see their watchlist
  return (
    <div className="mt-6">
      <PortfolioSummary stocks={stocks} />
      <WatchlistTable
        stocks={stocks}
        onAdd={addStock}
        onRemove={removeStock}
      />
    </div>
  );
}
