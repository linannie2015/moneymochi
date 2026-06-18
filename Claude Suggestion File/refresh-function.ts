// =====================================================================
//  MoneyMochi - scheduled refresh Edge Function
//  Path: supabase/functions/refresh/index.ts
//
//  What it does on every run (e.g. every 30 min via pg_cron):
//   1. For each tracked stock: pull live quote + key metrics  -> quotes table
//   2. Pull recent news headlines                             -> news table
//   3. (optional) Pull daily price history                    -> prices_daily
//   4. Check price alerts and email you if any are reached     -> watches table
//
//  Your API keys live here as Supabase secrets - NEVER in the frontend.
//  Set them with:
//    supabase secrets set FINNHUB_KEY=xxx TWELVEDATA_KEY=xxx RESEND_KEY=xxx
//  Deploy with:
//    supabase functions deploy refresh
//  (Tip: you can paste this whole file to Claude Code and ask it to wire it up.)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const FINNHUB = Deno.env.get("FINNHUB_KEY")!;
const TWELVE  = Deno.env.get("TWELVEDATA_KEY") ?? "";
const RESEND  = Deno.env.get("RESEND_KEY") ?? "";
const FROM_EMAIL = "MoneyMochi <alerts@yourdomain.com>"; // set to a verified sender

const j = (url: string) => fetch(url).then((r) => r.json());
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

Deno.serve(async () => {
  const { data: stocks } = await supabase.from("stocks").select("ticker");

  for (const { ticker } of stocks ?? []) {
    try {
      // 1) quote + metrics
      const q  = await j(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB}`);
      const m  = await j(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB}`);
      const mm = m.metric ?? {};
      const lo = mm["52WeekLow"], hi = mm["52WeekHigh"];

      if (q && q.c) {
        await supabase.from("quotes").upsert({
          ticker,
          price: q.c,
          change_pct: q.dp,
          pe: mm.peTTM ?? null,
          market_cap: mm.marketCapitalization ?? null,
          week52_low: lo ?? null,
          week52_high: hi ?? null,
          support_low: lo ?? null,
          support_high: (lo && hi) ? lo + 0.18 * (hi - lo) : null,
          as_of: new Date().toISOString(),
        });
      }

      // 2) news (last 7 days, keep newest 10)
      const news = await j(
        `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${daysAgo(7)}&to=${today()}&token=${FINNHUB}`,
      );
      for (const n of (Array.isArray(news) ? news : []).slice(0, 10)) {
        if (!n.headline || !n.url) continue;
        await supabase.from("news").upsert(
          {
            ticker,
            headline: n.headline,
            url: n.url,
            source: n.source,
            published_at: new Date(n.datetime * 1000).toISOString(),
          },
          { onConflict: "ticker,url", ignoreDuplicates: true },
        );
      }

      // 3) daily history (optional - needs a Twelve Data key)
      if (TWELVE) {
        const ts = await j(
          `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=260&apikey=${TWELVE}`,
        );
        for (const v of (ts.values ?? [])) {
          await supabase.from("prices_daily").upsert({ ticker, d: v.datetime, close: Number(v.close) });
        }
      }
    } catch (e) {
      console.error(`refresh failed for ${ticker}:`, e);
    }
  }

  // 4) check price alerts -> email when reached
  const { data: watches } = await supabase.from("watches").select("*").eq("triggered", false);
  for (const w of watches ?? []) {
    const { data: row } = await supabase.from("quotes").select("price").eq("ticker", w.ticker).single();
    if (row && row.price != null && row.price <= w.target) {
      await sendEmail(w.notify_email, `${w.ticker} reached your level`,
        `${w.ticker} is at $${row.price} - your alert price was $${w.target}. This is an automated heads-up, not financial advice.`);
      await supabase.from("watches").update({ triggered: true }).eq("id", w.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, at: new Date().toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function sendEmail(to: string | null, subject: string, text: string) {
  if (!RESEND || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, text }),
  });
}
