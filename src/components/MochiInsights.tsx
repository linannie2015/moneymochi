'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import type { StockWithQuote, NewsItem } from '@/lib/types';

interface MochiInsightsProps {
  stock: StockWithQuote;
  news: NewsItem[];
}

interface InsightData {
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  bullishFactors: string[];
  bearishFactors: string[];
  keyMetric: string;
  outlook: string;
}

function generateInsight(stock: StockWithQuote, news: NewsItem[]): InsightData {
  const q = stock.quote;
  if (!q) {
    return {
      summary: 'Insufficient data to generate analysis.',
      sentiment: 'neutral',
      sentimentScore: 50,
      bullishFactors: [],
      bearishFactors: [],
      keyMetric: '',
      outlook: '',
    };
  }

  const insights = STOCK_INSIGHTS[stock.ticker];
  if (insights) return insights;

  const changePct = q.change_pct ?? 0;
  const pe = q.pe;
  const price = q.price ?? 0;
  const high = q.week52_high ?? price;
  const low = q.week52_low ?? price;
  const range = high - low;
  const posInRange = range > 0 ? ((price - low) / range) * 100 : 50;

  const bullish: string[] = [];
  const bearish: string[] = [];

  if (changePct > 0) bullish.push('Positive momentum in recent trading sessions');
  else if (changePct < -1) bearish.push('Short-term selling pressure observed');

  if (pe && pe < 25) bullish.push('Valuation appears reasonable relative to earnings');
  else if (pe && pe > 40) bearish.push('Premium valuation may limit near-term upside');

  if (posInRange < 30) bullish.push('Trading near the lower end of its 52-week range');
  else if (posInRange > 85) bearish.push('Trading near 52-week highs — limited historical upside from this level');

  if (q.market_cap && q.market_cap > 500e9) bullish.push('Large-cap stability with deep institutional ownership');
  if (news.length >= 2) bullish.push('Active news flow suggests market attention and catalysts');

  const sentimentScore = Math.min(90, Math.max(10, 50 + bullish.length * 12 - bearish.length * 15 + changePct * 3));

  return {
    summary: `${stock.name || stock.ticker} is showing ${changePct >= 0 ? 'positive' : 'negative'} momentum with ${bullish.length > bearish.length ? 'more supportive than cautionary' : 'mixed'} signals. The stock is trading at ${posInRange.toFixed(0)}% of its 52-week range.`,
    sentiment: sentimentScore >= 60 ? 'bullish' : sentimentScore <= 40 ? 'bearish' : 'neutral',
    sentimentScore: Math.round(sentimentScore),
    bullishFactors: bullish,
    bearishFactors: bearish,
    keyMetric: pe ? `P/E of ${pe.toFixed(1)}× compared to sector average` : 'Growth-stage company — evaluate on revenue trajectory',
    outlook: `Based on current technical positioning and fundamentals, ${stock.ticker} warrants ${sentimentScore >= 60 ? 'continued monitoring for entry opportunities' : sentimentScore <= 40 ? 'caution and careful position sizing' : 'a balanced approach with attention to catalysts'}.`,
  };
}

async function fetchLiveInsight(stock: StockWithQuote, news: NewsItem[]): Promise<InsightData | null> {
  const q = stock.quote;
  if (!q || !q.price) return null;

  try {
    const res = await fetch('/api/analyze-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: stock.ticker,
        name: stock.name,
        price: q.price,
        change_pct: q.change_pct,
        pe: q.pe,
        market_cap: q.market_cap,
        week52_high: q.week52_high,
        week52_low: q.week52_low,
        newsHeadlines: news.slice(0, 8).map(n => n.headline),
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const ins = data.insight;
    if (ins && ins.summary && Array.isArray(ins.bullishFactors) && Array.isArray(ins.bearishFactors)) {
      return ins as InsightData;
    }
    return null;
  } catch {
    return null;
  }
}

const STOCK_INSIGHTS: Record<string, InsightData> = {
  GOOGL: {
    summary: 'Alphabet holds a $4.4T market cap as Gemini AI integration drives both Search and Cloud revenue. Google Cloud crossing $50B annual run rate narrows the gap with Azure while Waymo scales to 1M+ rides per week.',
    sentiment: 'bullish',
    sentimentScore: 72,
    bullishFactors: [
      'Google Cloud at $50B annual run rate — rapidly closing the gap with Azure',
      'Waymo at 1M+ weekly rides across 12 cities signals autonomous vehicle scale',
      'P/E of 22× is attractive for a $4.4T company with accelerating AI revenue',
      'Gemini AI integration strengthening Search moat against emerging competitors',
    ],
    bearishFactors: [
      'Regulatory headwinds in multiple jurisdictions around antitrust concerns',
      'Trading mid-range of 52-week window ($300–$409) — not a deep value entry',
    ],
    keyMetric: 'P/E of 22× — one of the most reasonably valued mega-cap AI leaders',
    outlook: 'Strong multi-engine growth story with cloud, ads, and Waymo. The reasonable P/E provides margin of safety while AI tailwinds drive top-line acceleration.',
  },
  MSFT: {
    summary: 'Microsoft at $399 has pulled back from its 52-week high of $468 as cloud spending growth decelerates. Copilot surpassing 50M paid seats validates enterprise AI monetization, but capex pressure weighs on margins.',
    sentiment: 'neutral',
    sentimentScore: 60,
    bullishFactors: [
      'Copilot at 50M paid commercial seats — massive enterprise AI adoption',
      'Diversified revenue across cloud, productivity, gaming, and LinkedIn',
      'Pullback from $468 highs creates better entry point than six months ago',
      'Strong operating margins above 40%',
    ],
    bearishFactors: [
      'Cloud spending growth decelerating — Azure growth slowing from peak rates',
      'P/E of 30.5× is elevated for a company with moderating top-line growth',
      'AI infrastructure capex requirements compressing near-term free cash flow',
    ],
    keyMetric: '50M Copilot seats at ~$30/month = $18B annualized AI revenue stream',
    outlook: 'Best-in-class enterprise AI monetization with Copilot, but the pullback to $399 reflects slowing cloud growth. Reasonable entry for long-term investors but no longer the runaway growth story.',
  },
  META: {
    summary: 'Meta at $590 sits well below its 52-week high of $794 despite strong AI-driven ad efficiency. Llama 4 reaching 1B monthly active users strengthens Meta\'s open-source AI moat and ecosystem.',
    sentiment: 'bullish',
    sentimentScore: 70,
    bullishFactors: [
      'P/E of 22× is attractive for a $1.5T company with AI-driven margin expansion',
      'Llama 4 at 1B MAU builds powerful open-source AI ecosystem and developer lock-in',
      'Trading 26% below 52-week high — meaningful pullback from peaks',
      'AI ad targeting efficiency continuing to expand operating margins',
    ],
    bearishFactors: [
      'Heavy capex in AI infrastructure and metaverse investments',
      'Regulatory risks around data privacy and content moderation globally',
    ],
    keyMetric: 'P/E of 22× with 26% off highs — compelling value entry for mega-cap AI',
    outlook: 'Meta offers strong value at current levels with AI driving both ad efficiency and platform growth. The pullback from $794 creates an interesting risk/reward for patient investors.',
  },
  AMZN: {
    summary: 'Amazon at $238 trades below its 52-week high of $285 as retail margins expand through AI-powered automation. AWS Trainium3 custom chips reduce Nvidia dependency and improve cloud margins.',
    sentiment: 'bullish',
    sentimentScore: 65,
    bullishFactors: [
      'AWS Trainium3 chips power 30% of new AI workloads — reducing costs and Nvidia dependency',
      'Retail margins expanding through AI-driven warehouse and logistics automation',
      'Trading 16% below 52-week highs offers better entry than recent peaks',
    ],
    bearishFactors: [
      'P/E of 35× requires sustained growth across all segments',
      'Intense competition in cloud (Azure, GCP) and retail (Temu, Shein)',
      'Heavy capex in logistics, AI, and satellite (Kuiper)',
    ],
    keyMetric: 'Trainium3 powering 30% of new AI training = structural margin improvement for AWS',
    outlook: 'Multi-segment growth with custom AI silicon and retail automation driving margins higher. Valuation demands execution but the moat is deepening.',
  },
  AMD: {
    summary: 'AMD has surged to $549, up over 55% from its 52-week low of $350, as the MI400 AI accelerator wins major cloud contracts and establishes AMD as a credible Nvidia challenger in AI training.',
    sentiment: 'bullish',
    sentimentScore: 72,
    bullishFactors: [
      'MI400 AI accelerator winning major cloud contracts — challenging Nvidia B300',
      'P/E compressed to 35× from 98× a year ago — earnings catching up to the stock price',
      'EPYC server CPUs continuing to gain data center market share',
      'Trading near 52-week high of $558 reflects strong momentum',
    ],
    bearishFactors: [
      'Near 52-week highs — limited upside from current levels without new catalysts',
      'Nvidia still holds dominant AI accelerator market share',
    ],
    keyMetric: 'P/E dropped from 98× to 35× — earnings growth validated the premium valuation',
    outlook: 'AMD has delivered on its AI breakout thesis. The dramatically improved P/E shows earnings catching the stock. Near highs, so new positions require conviction in continued AI share gains.',
  },
  RKLB: {
    summary: 'Rocket Lab at $107 has nearly doubled from its 52-week low of $55 following Neutron\'s first commercial launch. The successful debut opens a $10B+ addressable market previously dominated by SpaceX.',
    sentiment: 'bullish',
    sentimentScore: 73,
    bullishFactors: [
      'Neutron first commercial launch completed — de-risks the growth thesis significantly',
      '$10B+ addressable market now open with medium-lift capability',
      'Vertically integrated space systems provide competitive moat',
      'KeyBanc upgrade reflects institutional recognition of execution',
    ],
    bearishFactors: [
      'No P/E ratio — company remains pre-profit with significant cash burn',
      'SpaceX IPO speculation creates sector-wide valuation uncertainty',
    ],
    keyMetric: 'Neutron commercial launch success transforms RKLB from small-launch to full-spectrum space company',
    outlook: 'Rocket Lab has de-risked its biggest catalyst with Neutron\'s commercial debut. The stock reflects this progress — investors should watch for revenue ramp and path to profitability.',
  },
  MU: {
    summary: 'Micron has surged to $1,057, up over 55% from its 52-week low of $680, as HBM4 memory chips achieve record bandwidth and lock in next-gen AI server contracts. The AI memory supercycle has been transformative.',
    sentiment: 'neutral',
    sentimentScore: 58,
    bullishFactors: [
      'HBM4 record bandwidth locks in multi-year AI server contracts',
      '$1.19T market cap reflects Micron\'s transformation into an AI infrastructure leader',
      'Data center revenue now dominates the revenue mix with premium margins',
    ],
    bearishFactors: [
      'P/E of 51.4× is elevated for a historically cyclical memory company',
      'Memory industry cycles — even AI-driven upcycles eventually moderate',
      'Trading near 52-week high of $1,133 — limited upside without fresh catalysts',
    ],
    keyMetric: 'P/E of 51.4× — pricing in sustained AI memory growth, but cycles always turn',
    outlook: 'Micron\'s AI transformation is remarkable, but the elevated P/E and proximity to 52-week highs suggest much of the good news is priced in. Cycle-aware position sizing is prudent.',
  },
  MSTR: {
    summary: 'Strategy (post-split) trades at $124 as the Bitcoin treasury strategy continues accumulation. S&P 500 membership drives steady passive fund inflows, adding structural demand for the stock.',
    sentiment: 'bullish',
    sentimentScore: 65,
    bullishFactors: [
      'S&P 500 membership provides structural passive fund buying pressure',
      'Largest corporate Bitcoin holder globally — leveraged BTC exposure',
      'Post-split price improves retail accessibility and options liquidity',
    ],
    bearishFactors: [
      'Extreme Bitcoin concentration creates binary risk profile',
      'No meaningful P/E — operating business is secondary to BTC holdings',
      'High volatility makes position sizing critical',
    ],
    keyMetric: 'S&P 500 inclusion = steady passive inflows from $7T+ in indexed assets',
    outlook: 'MSTR is essentially a leveraged Bitcoin ETF in equity form. S&P 500 membership provides structural support, but position sizing should reflect the extreme volatility.',
  },
  VOO: {
    summary: 'VOO at $694 approaches its 52-week high of $700 as the S&P 500 rallies on AI-driven earnings growth. Record inflows reflect broad investor confidence in large-cap US equities.',
    sentiment: 'bullish',
    sentimentScore: 65,
    bullishFactors: [
      'Record inflows signal strong investor conviction in US large-caps',
      'Ultra-low 0.03% expense ratio maximizes long-term compounding',
      'S&P 500 has historically returned ~10% annually over long periods',
    ],
    bearishFactors: [
      'Trading at 99% of 52-week high — very limited upside from current levels',
      'High concentration in top AI/tech holdings creates implicit sector risk',
    ],
    keyMetric: '0.03% expense ratio — $3/year cost per $10,000 invested',
    outlook: 'VOO remains the cornerstone allocation for long-term investors. Near all-time highs suggests dollar-cost averaging rather than lump-sum entry at this level.',
  },
  QQQM: {
    summary: 'QQQM at $306 nears its 52-week high of $308 as semiconductor and AI stocks lead a broad tech rally. The Nasdaq-100 continues to benefit from AI-driven earnings acceleration.',
    sentiment: 'neutral',
    sentimentScore: 58,
    bullishFactors: [
      'Tech-heavy composition capturing AI megatrend upside',
      'Lower expense ratio than QQQ makes it better for long-term holding',
      'AI and semiconductor earnings growth supporting index momentum',
    ],
    bearishFactors: [
      'Trading at 99% of 52-week high — extremely limited headroom',
      'Heavy tech concentration creates significant sector risk in corrections',
    ],
    keyMetric: 'At $306 vs $308 high — the risk/reward favors waiting for a pullback',
    outlook: 'QQQM offers amplified AI/tech exposure within a diversified wrapper. Near all-time highs, dollar-cost averaging is more prudent than lump-sum entry. Pair with VOO for balance.',
  },
};

function SentimentGauge({ score, sentiment }: { score: number; sentiment: string }) {
  const angle = (score / 100) * 180 - 90;
  const color = sentiment === 'bullish' ? 'var(--mint)' : sentiment === 'bearish' ? 'var(--coral)' : 'var(--sun)';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-[180px] h-[100px]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="50%" stopColor="var(--sun)" />
            <stop offset="100%" stopColor="var(--mint)" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--line)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.3} 251.3`}
        />
        <line
          x1="100" y1="100"
          x2={100 + 55 * Math.cos((angle * Math.PI) / 180)}
          y2={100 - 55 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        <text x="100" y="92" textAnchor="middle" className="font-heading" fontSize="22" fontWeight="700" fill="var(--ink)">
          {score}
        </text>
      </svg>
      <div
        className="font-heading font-semibold text-sm mt-1 px-3 py-0.5 rounded-full capitalize"
        style={{
          background: sentiment === 'bullish' ? 'var(--mint-soft)' : sentiment === 'bearish' ? 'var(--peach-soft)' : 'var(--sun-soft)',
          color: sentiment === 'bullish' ? '#1E7A55' : sentiment === 'bearish' ? '#B0492F' : '#A06A00',
        }}
      >
        {sentiment}
      </div>
    </div>
  );
}

export default function MochiInsights({ stock, news }: MochiInsightsProps) {
  const [expanded, setExpanded] = useState(false);
  const [liveInsight, setLiveInsight] = useState<InsightData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const staticInsight = generateInsight(stock, news);
  const insight = liveInsight ?? staticInsight;

  const refreshAI = useCallback(async (signal?: AbortSignal) => {
    setAiLoading(true);
    const result = await fetchLiveInsight(stock, news);
    if (!signal?.aborted && result) {
      setLiveInsight(result);
      setIsLive(true);
    }
    if (!signal?.aborted) setAiLoading(false);
  }, [stock, news]);

  useEffect(() => {
    if (stock.quote?.price && news.length > 0) {
      const controller = new AbortController();
      refreshAI(controller.signal);
      return () => controller.abort();
    }
  }, [stock.ticker, news.length, refreshAI]);

  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
        <img src="/logo-dango.svg" alt="" width={24} height={24} />
        <h2 className="text-xl">Mochi Insights</h2>
        <span className="text-xs font-semibold bg-lav-soft text-lav px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={12} /> AI-Powered
        </span>
        {isLive && (
          <span className="text-xs font-semibold bg-mint-soft text-[#1E7A55] px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
        <button
          onClick={refreshAI}
          disabled={aiLoading}
          className="ml-auto text-xs font-semibold text-sky flex items-center gap-1
                     bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50 p-0"
        >
          {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {aiLoading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </div>
      <p className="text-muted mb-4 max-w-3xl text-sm">
        Educational analysis based on publicly available data. This is <strong>not</strong> a recommendation to buy or sell.
      </p>

      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-3">
                <Brain size={20} className="text-lav flex-none mt-0.5" />
                <p className="text-sm leading-relaxed m-0">{insight.summary}</p>
              </div>

              <div className="bg-lav-soft/50 rounded-[14px] px-3.5 py-2.5 text-sm mt-3">
                <span className="font-heading font-semibold text-lav text-xs block mb-0.5">Key metric</span>
                {insight.keyMetric}
              </div>
            </div>

            <div className="flex-none flex justify-center">
              <SentimentGauge score={insight.sentimentScore} sentiment={insight.sentiment} />
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-semibold text-sky mt-4 bg-transparent border-none cursor-pointer hover:underline p-0"
          >
            {expanded ? 'Hide' : 'Show'} detailed analysis
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="mt-4 animate-fade-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-mint-soft/40 rounded-[14px] p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp size={18} className="text-[#1E7A55]" />
                    <h4 className="text-sm font-heading font-semibold text-[#1E7A55] m-0">Bullish factors</h4>
                  </div>
                  <ul className="text-sm space-y-2 pl-0 m-0 list-none">
                    {insight.bullishFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#1E7A55] flex-none mt-0.5">+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-peach-soft/40 rounded-[14px] p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingDown size={18} className="text-[#B0492F]" />
                    <h4 className="text-sm font-heading font-semibold text-[#B0492F] m-0">Bearish factors</h4>
                  </div>
                  <ul className="text-sm space-y-2 pl-0 m-0 list-none">
                    {insight.bearishFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#B0492F] flex-none mt-0.5">−</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-cream2 rounded-[14px] p-4">
                <h4 className="text-sm font-heading font-semibold m-0 mb-1.5">📊 Outlook</h4>
                <p className="text-sm m-0">{insight.outlook}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-sun-soft/60 border-t border-[#F0DCA0] px-5 py-3 text-xs text-[#A06A00]">
          <strong>⚠️ Educational only.</strong> Mochi Insights uses publicly available data and general analysis frameworks.
          This is not financial advice. Always do your own research and consult a licensed advisor before making investment decisions.
        </div>
      </div>
    </section>
  );
}
