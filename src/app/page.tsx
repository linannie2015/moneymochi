'use client';

import WatchlistTable from '@/components/WatchlistTable';
import PortfolioSummary from '@/components/PortfolioSummary';
import { useWatchlist } from '@/lib/hooks';

export default function HomePage() {
  const { stocks, addStock, removeStock } = useWatchlist();

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
