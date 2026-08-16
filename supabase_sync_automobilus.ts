import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Link-ul feed-ului CSV de la 2Performant (Tools → My Feeds → Copy CSV link)
const FEED_URL = 'https://api.2performant.com/feed/85a498564.csv';

// Cuvinte cheie (fără diacritice) — mapează categoria/titlul din feed la categoriile AutoAssist.
// Le putem extinde ușor dacă vedem că lipsesc produse relevante după primul test.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'ulei-motor':         ['ulei motor', 'ulei de motor'],
  'filtre-ulei':        ['filtru ulei', 'filtru de ulei'],
  'filtru-habitaclu':   ['filtru habitaclu', 'filtru polen', 'filtru pentru habitaclu'],
  'filtre-aer':         ['filtru aer', 'filtru de aer'],
  'filtru-combustibil': ['filtru combustibil', 'filtru motorina', 'filtru benzina'],
  'placute-frana':      ['placute frana', 'placute de frana'],
  'bujii':              ['bujie', 'bujii'],
  'baterie':            ['baterie auto', 'acumulator'],
  'discuri-frana':      ['disc frana', 'discuri frana'],
  'curea-distributie':  ['kit distributie', 'curea distributie'],
  'amortizoare':        ['amortizor'],
};

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i')
    .replace(/ș/g,'s').replace(/ş/g,'s').replace(/ț/g,'t').replace(/ţ/g,'t');
}

function matchCategory(categorie: string, titlu: string): string | null {
  const text = normalize((categorie || '') + ' ' + (titlu || ''));
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return cat;
    }
  }
  return null;
}

// Parser CSV care respectă câmpuri între ghilimele (cu virgule/ghilimele escapate "" )
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { result.push(cur); cur = ''; }
      else cur += c;
    }
  }
  result.push(cur);
  return result;
}

// Structura confirmată a feed-ului (18 coloane), indexate de la 0:
// 0 Feed Name | 1 Added at | 2 Product ID | 3 Active | 4 Merchant URL | 5 Product URL
// 6 Merchant Program ID | 7 Brand | 8 (id intern) | 9 Old price | 10 Other data
// 11 Category | 12 Product title | 13 Marketer Link | 14 Sale price
// 15 Merchant Program | 16 Image URLs | 17 Description

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const res = await fetch(FEED_URL, { redirect: 'follow' });
    if (!res.ok || !res.body) throw new Error('Nu am putut descărca feed-ul: ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let totalRows = 0;
    let matched = 0;
    let batch: any[] = [];
    const BATCH_SIZE = 500;

    async function flushBatch() {
      if (batch.length === 0) return;
      const { error } = await supabase.from('piese_automobilus').upsert(batch, { onConflict: 'id' });
      if (error) console.error('Eroare upsert:', error.message);
      batch = [];
    }

    function processLine(line: string) {
      if (!line.trim()) return;
      totalRows++;
      const cols = parseCsvLine(line);
      if (cols.length < 18) return;

      const productId = cols[2];
      const brand = cols[7];
      const oldPriceRaw = cols[9];
      const categorie = cols[11];
      const titlu = cols[12];
      const marketerLink = cols[13];
      const priceRaw = cols[14];
      const imagine = cols[16];

      const catApp = matchCategory(categorie, titlu);
      if (!catApp) return; // păstrăm doar produsele relevante pentru AutoAssist

      const pret = parseFloat(priceRaw);
      if (!pret || isNaN(pret)) return;

      matched++;
      batch.push({
        id: productId,
        brand: brand || null,
        categorie,
        categorie_app: catApp,
        titlu,
        pret,
        pret_vechi: oldPriceRaw ? parseFloat(oldPriceRaw) : null,
        imagine: imagine || null,
        link_cumparare: marketerLink,
        updated_at: new Date().toISOString(),
      });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // ultima linie, posibil incompletă, rămâne pentru următoarea iterație

      for (const line of lines) {
        processLine(line);
        if (batch.length >= BATCH_SIZE) await flushBatch();
      }
    }
    if (buffer.trim()) processLine(buffer);
    await flushBatch();

    return new Response(JSON.stringify({ ok: true, total_rows: totalRows, matched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
