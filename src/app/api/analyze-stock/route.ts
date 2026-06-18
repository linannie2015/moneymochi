import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  const { ticker, name, price, change_pct, pe, market_cap, week52_high, week52_low, newsHeadlines } = await req.json();

  if (!ticker || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const posInRange = week52_high && week52_low && week52_high !== week52_low
    ? (((price - week52_low) / (week52_high - week52_low)) * 100).toFixed(0)
    : '50';

  const newsBlock = newsHeadlines?.length
    ? newsHeadlines.map((h: string) => `- ${h}`).join('\n')
    : 'No recent news available';

  const prompt = `You are a stock analysis AI for MoneyMochi, an educational finance dashboard. Analyze ${ticker} (${name || ticker}) based on the data below.

Current data:
- Price: $${price}
- Today's change: ${change_pct ?? 0}%
- P/E ratio: ${pe ?? 'N/A (pre-profit or unavailable)'}
- Market cap: ${market_cap ? '$' + (market_cap >= 1e12 ? (market_cap / 1e12).toFixed(2) + 'T' : market_cap >= 1e9 ? (market_cap / 1e9).toFixed(1) + 'B' : (market_cap / 1e6).toFixed(0) + 'M') : 'N/A'}
- 52-week high: $${week52_high}
- 52-week low: $${week52_low}
- Position in 52-week range: ${posInRange}%

Recent news headlines:
${newsBlock}

INSTRUCTIONS:
1. Analyze the stock's current position, incorporating the news headlines into your assessment
2. If news is positive/negative, reflect that in your sentiment and factors
3. Consider how sector trends and competitor news affect this stock
4. Frame everything as EDUCATIONAL context, never as financial advice
5. Never recommend buying or selling

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence educational analysis incorporating current news and price action",
  "sentiment": "bullish" or "bearish" or "neutral",
  "sentimentScore": <number 0-100, where 50=neutral, >60=bullish, <40=bearish>,
  "bullishFactors": ["factor 1", "factor 2", ...],
  "bearishFactors": ["factor 1", "factor 2", ...],
  "keyMetric": "one key metric or news-driven insight worth highlighting",
  "outlook": "1-2 sentence educational outlook incorporating recent catalysts"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `API error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse analysis' }, { status: 422 });
    }

    let insight;
    try { insight = JSON.parse(jsonMatch[0]); }
    catch { return NextResponse.json({ error: 'Invalid response format' }, { status: 422 }); }
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
