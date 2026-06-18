'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, ScanSearch, Check, X, Sparkles, AlertCircle, ImagePlus } from 'lucide-react';

interface DetectedHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  selected: boolean;
}

interface PortfolioImportProps {
  onImport: (holdings: { ticker: string; shares: number; avgCost: number }[]) => void;
}

export default function PortfolioImport({ onImport }: PortfolioImportProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/png');
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<DetectedHolding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setError(null);
    setDetected(null);
    setImported(false);
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const scan = useCallback(async () => {
    if (!preview) return;
    setScanning(true);
    setError(null);
    setDetected(null);

    const base64 = preview.split(',')[1];

    try {
      const res = await fetch('/api/scan-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to scan image');
        setScanning(false);
        return;
      }

      if (!data.holdings || data.holdings.length === 0) {
        setError('No holdings detected in the screenshot. Try a clearer image showing your positions.');
        setScanning(false);
        return;
      }

      setDetected(data.holdings.map((h: { ticker: string; shares: number; avgCost: number }) => ({
        ...h,
        ticker: h.ticker.toUpperCase(),
        selected: true,
      })));
    } catch {
      setError('Network error — check your connection and try again.');
    }
    setScanning(false);
  }, [preview, mimeType]);

  const toggleSelect = (i: number) => {
    setDetected(prev => prev?.map((h, j) => j === i ? { ...h, selected: !h.selected } : h) ?? null);
  };

  const handleImport = () => {
    if (!detected) return;
    const selected = detected.filter(h => h.selected);
    if (selected.length === 0) return;
    onImport(selected.map(({ ticker, shares, avgCost }) => ({ ticker, shares, avgCost })));
    setImported(true);
  };

  const reset = () => {
    setPreview(null);
    setDetected(null);
    setError(null);
    setImported(false);
    setScanning(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const selectedCount = detected?.filter(h => h.selected).length ?? 0;

  return (
    <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-1">
        <Sparkles size={18} className="text-lav" />
        <h2 className="text-lg">AI Portfolio Import</h2>
      </div>
      <p className="text-xs text-muted mb-4">
        Upload a screenshot from your broker app and our AI will detect your holdings automatically.
      </p>

      {!preview ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`
            border-2 border-dashed rounded-[var(--r-sm)] p-8 text-center cursor-pointer
            transition-all duration-200 group
            ${dragOver
              ? 'border-lav bg-lav-soft scale-[1.01]'
              : 'border-line hover:border-peach hover:bg-peach-soft/30'}
          `}
        >
          <ImagePlus size={40} className={`mx-auto mb-3 ${dragOver ? 'text-lav' : 'text-grey group-hover:text-peach'} transition-colors`} />
          <div className="font-heading font-semibold text-sm mb-1">
            {dragOver ? 'Drop it here!' : 'Drop your broker screenshot here'}
          </div>
          <div className="text-xs text-muted">
            or click to browse · PNG, JPG, WEBP
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div>
          <div className="relative mb-4">
            <img
              src={preview}
              alt="Portfolio screenshot"
              className="w-full max-h-[300px] object-contain rounded-[var(--r-sm)] border border-line"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card border border-line
                         grid place-items-center cursor-pointer hover:bg-peach-soft hover:border-peach transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {!detected && !imported && (
            <button
              onClick={scan}
              disabled={scanning}
              className="w-full font-heading font-semibold text-sm border-none rounded-xl px-4 py-3
                         cursor-pointer transition-all flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed
                         bg-gradient-to-r from-[#B79CE0] to-[#ED8A6E] text-white
                         hover:shadow-[var(--shadow)] hover:scale-[1.01] active:scale-[0.99]"
            >
              {scanning ? (
                <>
                  <ScanSearch size={18} className="animate-pulse" />
                  Scanning with AI...
                </>
              ) : (
                <>
                  <ScanSearch size={18} />
                  Scan Screenshot
                </>
              )}
            </button>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-peach-soft border border-peach rounded-[var(--r-sm)] p-3.5 mt-4 text-sm">
              <AlertCircle size={18} className="text-[#B0492F] flex-none mt-0.5" />
              <span className="text-[#B0492F]">{error}</span>
            </div>
          )}

          {detected && !imported && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-heading font-semibold">
                  Found {detected.length} holding{detected.length !== 1 ? 's' : ''}
                </div>
                <span className="text-xs text-muted">
                  {selectedCount} selected
                </span>
              </div>

              <div className="border border-line rounded-[14px] overflow-hidden mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="font-heading font-semibold text-[0.68rem] uppercase tracking-wider text-muted text-left px-3 py-2.5 bg-cream2 border-b border-line w-8" />
                      <th className="font-heading font-semibold text-[0.68rem] uppercase tracking-wider text-muted text-left px-3 py-2.5 bg-cream2 border-b border-line">Ticker</th>
                      <th className="font-heading font-semibold text-[0.68rem] uppercase tracking-wider text-muted text-left px-3 py-2.5 bg-cream2 border-b border-line">Shares</th>
                      <th className="font-heading font-semibold text-[0.68rem] uppercase tracking-wider text-muted text-left px-3 py-2.5 bg-cream2 border-b border-line">Avg Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detected.map((h, i) => (
                      <tr
                        key={`${h.ticker}-${i}`}
                        onClick={() => toggleSelect(i)}
                        className={`cursor-pointer transition-colors ${h.selected ? 'bg-card hover:bg-cream' : 'bg-cream2/50 opacity-50 hover:opacity-70'}`}
                      >
                        <td className="px-3 py-2.5 border-b border-line">
                          <div className={`w-5 h-5 rounded-md border-2 grid place-items-center transition-all ${
                            h.selected ? 'border-lav bg-lav-soft' : 'border-line'
                          }`}>
                            {h.selected && <Check size={12} className="text-[#6B4FA0]" />}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-b border-line font-heading font-bold text-sm">{h.ticker}</td>
                        <td className="px-3 py-2.5 border-b border-line font-heading font-semibold text-sm">{h.shares}</td>
                        <td className="px-3 py-2.5 border-b border-line font-heading font-semibold text-sm">${h.avgCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="flex-1 font-heading font-semibold text-sm bg-[#1E7A55] text-white border-none rounded-xl px-4 py-3
                             cursor-pointer hover:bg-[#176843] transition-all flex items-center justify-center gap-2
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={16} />
                  Import {selectedCount} holding{selectedCount !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={reset}
                  className="font-heading font-semibold text-sm bg-cream2 text-muted border-2 border-line rounded-xl px-4 py-3
                             cursor-pointer hover:border-peach hover:text-ink transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {imported && (
            <div className="mt-4 bg-mint-soft border border-[#1E7A55]/20 rounded-[var(--r-sm)] p-4 text-center animate-pop">
              <Check size={28} className="mx-auto mb-2 text-[#1E7A55]" />
              <div className="font-heading font-semibold text-sm text-[#1E7A55]">
                Holdings imported successfully!
              </div>
              <button
                onClick={reset}
                className="mt-3 text-xs font-semibold text-muted bg-transparent border-none cursor-pointer hover:text-ink transition-colors underline"
              >
                Scan another screenshot
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
