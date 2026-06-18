import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local' },
      { status: 500 },
    );
  }

  const { image, mimeType } = await req.json() as { image: string; mimeType: string };
  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

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
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: image },
              },
              {
                type: 'text',
                text: `Analyze this brokerage/portfolio screenshot and extract every stock holding you can see.

For each holding, extract:
- "ticker": the stock ticker symbol (uppercase, e.g. "AAPL")
- "shares": number of shares held (as a number)
- "avgCost": average cost per share in USD (as a number, no dollar sign)

If you can see the current price but NOT the average cost, use the current price as avgCost.
If you cannot determine shares, default to 1.
Only include stocks/ETFs — skip cash balances, options, or crypto.

Return ONLY a JSON array, no explanation. Example:
[{"ticker":"AAPL","shares":10,"avgCost":185.50},{"ticker":"MSFT","shares":5,"avgCost":410.00}]`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '[]';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse holdings from image', raw: text }, { status: 422 });
    }

    const holdings = JSON.parse(jsonMatch[0]) as Array<{
      ticker: string;
      shares: number;
      avgCost: number;
    }>;
    return NextResponse.json({ holdings });
  } catch {
    return NextResponse.json({ error: 'Analysis failed — check your network connection and try again' }, { status: 500 });
  }
}
