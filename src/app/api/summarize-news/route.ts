import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  const { ticker, headlines } = await req.json() as { ticker: string; headlines: string[] };

  if (!ticker || !headlines?.length) {
    return NextResponse.json({ error: 'Missing ticker or headlines' }, { status: 400 });
  }

  const prompt = `You are a news analyst for MoneyMochi, an educational finance app. Summarize these recent ${ticker} news headlines into a concise digest.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Write a 2-4 sentence summary that:
- Captures the key themes and catalysts from ALL the headlines
- Notes if sentiment is mostly positive, negative, or mixed
- Highlights the most impactful story
- Uses simple language a retail investor would understand

IMPORTANT: This is educational context only, not financial advice. Do not recommend any action.

Return ONLY valid JSON:
{
  "summary": "your 2-4 sentence digest here",
  "sentiment": "positive" or "negative" or "mixed",
  "topStory": "the single most impactful headline paraphrased in one sentence"
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
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API error' }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse summary' }, { status: 422 });
    }

    let result;
    try { result = JSON.parse(jsonMatch[0]); }
    catch { return NextResponse.json({ error: 'Invalid response format' }, { status: 422 }); }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Summary failed' }, { status: 500 });
  }
}
