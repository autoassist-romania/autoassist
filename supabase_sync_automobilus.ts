import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Link-ul feed-ului CSV de la 2Performant (Tools → My Feeds → Copy CSV link)
const FEED_URL = 'https://api.2performant.com/feed/85a498564.csv';
// Id fix în tabela sync_progress — o singură sarcină de sync urmărită momentan (feed-ul Automobilus)
const SYNC_ID = 'automobilus';
// Mărime bucată per rulare — trebuie să încapem confortabil în limita de 150s (wall-clock) a planului Free
const CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

// Cuvinte cheie (fără diacritice) — mapează categoria/titlul din feed la categoriile AutoAssist.
// Le putem extinde ușor dacă vedem că lipsesc produse relevante după primul test.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Mentenanță (afișate ca badge/interval în grid-ul principal)
  'ulei-motor':         ['ulei motor', 'ulei de motor'],
  'filtre-ulei':        ['filtru ulei', 'filtru de ulei'],
  'filtru-habitaclu':   ['filtru habitaclu', 'filtru polen', 'filtru pentru habitaclu', 'filtru, aer habitaclu'],
  'filtre-aer':         ['filtru aer', 'filtru de aer'],
  'filtru-combustibil': ['filtru combustibil', 'filtru motorina', 'filtru benzina'],
  'placute-frana':      ['placute frana', 'placute de frana'],
  'bujii':              ['bujie', 'bujii'],
  'baterie':            ['baterie auto', 'acumulator'],
  'discuri-frana':      ['disc frana', 'discuri frana'],
  'curea-distributie':  ['kit distributie', 'curea distributie'],
  'amortizoare':        ['amortizor'],
  // Alte piese (doar căutare, fără interval/badge — nu au termen fix de schimbare)
  'pompa-apa':                 ['pompa apa'],
  'termostat':                 ['termostat'],
  'radiator-apa':               ['radiator apa', 'radiator racire'],
  'alternator':                ['alternator'],
  'electromotor':              ['electromotor', 'demaror'],
  'bobina-inductie':           ['bobina inductie', 'bobina aprindere'],
  'injector':                  ['injector'],
  'rulment-roata':             ['rulment roata'],
  'etrier-frana':              ['etrier frana'],
  'senzor-abs':                ['senzor abs'],
  'sonda-lambda':              ['sonda lambda', 'senzor oxigen'],
  'catalizator':               ['catalizator'],
  'compresor-ac':              ['compresor aer conditionat', 'compresor climatizare', 'compresor ac'],
  'pompa-servodirectie':       ['pompa servodirectie'],
  'cap-bara':                  ['cap bara'],
  'bieleta-directie':          ['bieleta directie'],
  'brat-suspensie':            ['brat suspensie'],
  'kit-ambreiaj':              ['kit ambreiaj', 'set ambreiaj'],
  'rulment-presiune-ambreiaj': ['rulment presiune ambreiaj'],
  'burduf-planetara':          ['burduf planetara'],
  'toba-esapament':            ['toba esapament', 'toba finala', 'toba intermediara'],
  'far-auto':                  ['far auto'],
  'stergatoare':                ['stergator parbriz', 'stergatoare parbriz'],
  'senzori-parcare':           ['senzor parcare', 'senzori parcare'],
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

    // ── Citesc progresul curent; dacă nu există rândul (prima rulare vreodată), îl creez ──
    const { data: progressRow, error: progressErr } = await supabase
      .from('sync_progress')
      .select('byte_offset, is_done')
      .eq('id', SYNC_ID)
      .maybeSingle();
    if (progressErr) throw new Error('Nu am putut citi sync_progress: ' + progressErr.message);

    if (!progressRow) {
      await supabase.from('sync_progress').insert({ id: SYNC_ID, byte_offset: 0, is_done: false });
    }

    if (progressRow?.is_done) {
      return new Response(JSON.stringify({ ok: true, message: 'Sincronizare deja completă pentru azi — se resetează la 3:00.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const byteOffset = progressRow?.byte_offset ?? 0;
    const rangeEnd = byteOffset + CHUNK_SIZE_BYTES - 1;

    // ── Descarc DOAR bucata curentă din feed, via Range request ──
    const res = await fetch(FEED_URL, {
      redirect: 'follow',
      headers: { 'Range': `bytes=${byteOffset}-${rangeEnd}` },
    });
    if (!res.ok && res.status !== 206) throw new Error('Nu am putut descărca bucata din feed: ' + res.status);

    const rangeHonored = res.status === 206;
    if (!rangeHonored) {
      // Serverul feed-ului nu suportă Range requests — chunking-ul pe bucăți nu poate funcționa așa cum e proiectat,
      // iar procesarea integrală ar da din nou timeout la 150s. Mai bine eșuăm explicit decât să reîncercăm orbește.
      throw new Error(`Serverul feed-ului nu a răspuns cu 206 Partial Content la Range request (a răspuns cu ${res.status}) — probabil nu suportă Range. Necesită altă strategie de chunking.`);
    }

    let totalSize: number | null = null;
    const contentRange = res.headers.get('content-range'); // format: "bytes 0-4194303/123456789"
    const m = contentRange?.match(/\/(\d+)$/);
    if (m) totalSize = parseInt(m[1]);

    const buf = new Uint8Array(await res.arrayBuffer());
    const isLastChunk = totalSize !== null && (byteOffset + buf.length >= totalSize);

    // ── Găsesc ultima linie COMPLETĂ din bucată (caut ultimul \n direct în bytes, ca să nu tai un caracter UTF-8 la mijloc) ──
    let lastNewline = -1;
    for (let i = buf.length - 1; i >= 0; i--) {
      if (buf[i] === 10) { lastNewline = i; break; }
    }

    let usableBuf: Uint8Array;
    let bytesConsumed: number;
    if (lastNewline === -1 && !isLastChunk) {
      // Nicio linie completă în 4MB (extrem de neobișnuit) — nu procesez nimic acum, reîncerc data viitoare fără să avansez offset-ul
      return new Response(JSON.stringify({ ok: true, warning: 'Nicio linie completă găsită în bucata curentă — reîncerc la următoarea rulare.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (isLastChunk) {
      // Ultima bucată din fișier — procesez tot, inclusiv eventuala linie finală fără \n la capăt de fișier
      usableBuf = buf;
      bytesConsumed = buf.length;
    } else {
      usableBuf = buf.subarray(0, lastNewline + 1);
      bytesConsumed = lastNewline + 1;
    }

    const text = new TextDecoder('utf-8').decode(usableBuf);
    const lines = text.split('\n');

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

    for (const line of lines) {
      processLine(line);
      if (batch.length >= BATCH_SIZE) await flushBatch();
    }
    await flushBatch();

    const newByteOffset = byteOffset + bytesConsumed;

    await supabase.from('sync_progress').update({
      byte_offset: newByteOffset,
      is_done: isLastChunk,
      updated_at: new Date().toISOString(),
    }).eq('id', SYNC_ID);

    return new Response(JSON.stringify({
      ok: true,
      chunk_bytes: bytesConsumed,
      byte_offset_before: byteOffset,
      byte_offset_after: newByteOffset,
      total_size: totalSize,
      is_done: isLastChunk,
      rows_in_chunk: totalRows,
      matched_in_chunk: matched,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
