// api/vehicul.js — Vercel Edge Function PRINCIPALĂ
// Un singur call → returnează: județ + RCA + rovignetă + ITP
// Usage: GET /api/vehicul?nr=B123ABC
// Usage debug: GET /api/vehicul?nr=B123ABC&debug=1

export const config = { runtime: 'edge' };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const { searchParams } = new URL(req.url);
  const nrRaw = searchParams.get('nr') || '';
  const nrAuto = nrRaw.toUpperCase().replace(/\s/g, '');
  const debug = searchParams.get('debug') === '1';

  if (!nrAuto || nrAuto.length < 4) {
    return json({ error: 'Nr. înmatriculare invalid' }, 400);
  }

  const judet = getJudet(nrAuto);
  const debugLog = {};

  // Rulăm RCA și Rovinieta în paralel
  const [rcaResult, rovResult] = await Promise.allSettled([
    verificaRCA(nrAuto, debugLog),
    verificaRovinieta(nrAuto, debugLog),
  ]);

  const result = {
    nr: nrAuto,
    judet,
    timestamp: new Date().toISOString(),
    rca: rcaResult.status === 'fulfilled' ? rcaResult.value : { valid: null, mesaj: 'Eroare verificare RCA', error: rcaResult.reason?.message },
    rovinieta: rovResult.status === 'fulfilled' ? rovResult.value : { valid: null, mesaj: 'Eroare verificare rovinieta', error: rovResult.reason?.message },
    itp: { valid: null, mesaj: 'Introdu VIN-ul din talon pentru verificare ITP', necesitaVIN: true },
  };

  if (debug) result._debug = debugLog;

  return json(result, 200);
}

// ═══ RCA — încearcă mai multe surse ═══
async function verificaRCA(nr, log) {

  // Sursa 1: BAAR WebService (folosit de aplicații licențiate)
  try {
    const res = await fetch(`https://ws.baar.ro/api/polita?nr=${encodeURIComponent(nr)}`, {
      headers: { ...HEADERS, 'Accept': 'application/json', 'Referer': 'https://www.aida.info.ro/' }
    });
    if (log) log.baar_status = res.status;
    if (res.ok) {
      const data = await res.json();
      if (log) log.baar_data = JSON.stringify(data).substring(0, 200);
      const parsed = parseBAAR(data, nr);
      if (parsed.valid !== null) return parsed;
    }
  } catch(e) {
    if (log) log.baar_error = e.message;
  }

  // Sursa 2: AIDA cu GET simplu (fără POST, fără CSRF)
  try {
    const url = `https://www.aida.info.ro/verificare-rca?nr=${encodeURIComponent(nr)}`;
    const res = await fetch(url, {
      headers: { ...HEADERS, 'Referer': 'https://www.aida.info.ro/' }
    });
    if (log) log.aida_get_status = res.status;
    if (res.ok) {
      const html = await res.text();
      if (log) log.aida_get_snippet = html.substring(0, 500);
      const parsed = parseAIDA(html);
      if (parsed.valid !== null) return parsed;
    }
  } catch(e) {
    if (log) log.aida_get_error = e.message;
  }

  // Sursa 3: AIDA cu POST + sesiune (varianta originală)
  try {
    const initRes = await fetch('https://www.aida.info.ro/polite-rca', {
      headers: { ...HEADERS, 'Referer': 'https://www.aida.info.ro/' }
    });
    if (log) log.aida_init_status = initRes.status;

    const cookies = extractCookies(initRes.headers.get('set-cookie'));
    const initHtml = await initRes.text();
    if (log) log.aida_init_snippet = initHtml.substring(0, 300);

    const tokenMatch = initHtml.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    const token = tokenMatch ? tokenMatch[1] : '';

    const today = new Date().toISOString().split('T')[0];
    const body = new URLSearchParams({
      'CriteriuCautare': '1',
      'NrInmatriculare': nr,
      'DataVerificare': today,
      'acord': 'true',
    });
    if (token) body.set('__RequestVerificationToken', token);

    const postRes = await fetch('https://www.aida.info.ro/polite-rca', {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.aida.info.ro/polite-rca',
        'Origin': 'https://www.aida.info.ro',
        'Cookie': cookies,
      },
      body: body.toString()
    });
    if (log) log.aida_post_status = postRes.status;

    const html = await postRes.text();
    if (log) log.aida_post_snippet = html.substring(0, 800);

    return parseAIDA(html);
  } catch(e) {
    if (log) log.aida_post_error = e.message;
  }

  return { valid: null, mesaj: 'Status RCA nedeterminat — verifică manual pe aida.info.ro' };
}

function parseBAAR(data, nr) {
  // Structura BAAR WebService
  if (!data) return { valid: null, mesaj: 'Fără date BAAR' };
  const polita = data.polita || data.Polita || data[0];
  if (!polita) return { valid: null, mesaj: 'Fără poliță în răspuns BAAR' };

  const expiraStr = polita.DataExpirare || polita.dataExpirare || polita.expiraLa;
  if (!expiraStr) return { valid: null, mesaj: 'Dată expirare lipsă' };

  const expira = new Date(expiraStr);
  const valid = expira > new Date();
  return {
    valid,
    expira: formatData(expiraStr),
    asigurator: polita.Asigurator || polita.asigurator || null,
    zileRamase: calcZile(expiraStr),
    mesaj: valid ? 'Poliță RCA validă' : 'RCA expirat',
    sursa: 'BAAR'
  };
}

function parseAIDA(html) {
  if (!html || html.length < 100) return { valid: null, mesaj: 'Răspuns AIDA gol' };

  // Dacă AIDA a returnat Cloudflare challenge sau pagină de eroare
  if (html.includes('cf-browser-verification') || html.includes('Just a moment') || html.includes('Enable JavaScript')) {
    return { valid: null, mesaj: 'AIDA blochează verificarea automată' };
  }

  const nuExista = html.match(/nu exist[aă]|nu a fost g[aă]sit|no result|nu s-a g[aă]sit/i);
  if (nuExista) return { valid: false, expira: null, mesaj: 'Nu există poliță RCA validă' };

  const expirMatch = html.match(/([0-9]{2}[.][0-9]{2}[.][0-9]{4})/g);
  const asigurator = html.match(/(?:Allianz|Groupama|Omniasig|Euroins|Generali|Uniqa|Grawe|Asirom|Hellas|Signal|Axeria|Casco)[^<\n]*/i);

  if (expirMatch) {
    for (const d of expirMatch) {
      const parts = d.split('.');
      const data = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (data > new Date()) {
        return {
          valid: true,
          expira: d,
          asigurator: asigurator ? asigurator[0].trim().substring(0, 40) : null,
          zileRamase: Math.ceil((data - new Date()) / 86400000),
          mesaj: 'Poliță RCA validă',
          sursa: 'AIDA'
        };
      }
    }
    return { valid: false, expira: expirMatch[0], mesaj: 'RCA expirat' };
  }

  return { valid: null, mesaj: 'Status RCA nedeterminat' };
}

// ═══ ROVINIETA — încearcă mai multe endpoint-uri ═══
async function verificaRovinieta(nr, log) {

  // Endpoint 1: API oficial CNAIR (folosit de aplicația erovinieta)
  const endpoints = [
    `https://api.erovinieta.ro/vignettes?plateNumber=${encodeURIComponent(nr)}&countryCode=RO`,
    `https://www.erovinieta.ro/api/v1/vignettes?plateNumber=${encodeURIComponent(nr)}`,
    `https://erovinieta.ro/api/vignettes?plate=${encodeURIComponent(nr)}`,
  ];

  for (let i = 0; i < endpoints.length; i++) {
    try {
      const res = await fetch(endpoints[i], {
        headers: {
          ...HEADERS,
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.erovinieta.ro/',
          'Origin': 'https://www.erovinieta.ro',
        }
      });
      if (log) log[`rov_api${i+1}_status`] = res.status;

      if (res.ok) {
        const text = await res.text();
        if (log) log[`rov_api${i+1}_snippet`] = text.substring(0, 300);
        try {
          const data = JSON.parse(text);
          const parsed = parseRovinieta(data);
          if (parsed.valid !== null) return parsed;
        } catch(e) {}
      }
    } catch(e) {
      if (log) log[`rov_api${i+1}_error`] = e.message;
    }
  }

  // Fallback: scraping pagina CNAIR
  try {
    const res = await fetch(`https://www.erovinieta.ro/verificare-vigneta?nr=${encodeURIComponent(nr)}`, {
      headers: { ...HEADERS, 'Referer': 'https://www.erovinieta.ro/' }
    });
    if (log) log.rov_scrape_status = res.status;

    if (res.ok) {
      const html = await res.text();
      if (log) log.rov_scrape_snippet = html.substring(0, 500);
      return scrapeRovinieta(html);
    }
  } catch(e) {
    if (log) log.rov_scrape_error = e.message;
  }

  return { valid: null, mesaj: 'Status rovinieta nedeterminat — verifică pe erovinieta.ro' };
}

function parseRovinieta(data) {
  const items = Array.isArray(data) ? data : (data?.vignettes || data?.items || data?.data || []);
  if (!items || !items.length) return { valid: false, mesaj: 'Nu există rovinieta activă' };

  const azi = new Date();
  const activa = items.find(v => {
    const exp = v.endDate || v.validTo || v.expirDate || v.dataExpirare;
    return exp && new Date(exp) > azi;
  });

  if (!activa) {
    const last = items[0];
    const exp = last?.endDate || last?.validTo || last?.expirDate;
    return { valid: false, expira: formatData(exp), mesaj: 'Rovinieta expirată' };
  }

  const expStr = activa.endDate || activa.validTo || activa.expirDate || activa.dataExpirare;
  return {
    valid: true,
    expira: formatData(expStr),
    start: formatData(activa.startDate || activa.validFrom),
    categorie: activa.category || activa.vehicleCategory || 'A',
    zileRamase: calcZile(expStr),
    mesaj: 'Rovinieta activă',
    sursa: 'CNAIR'
  };
}

function scrapeRovinieta(html) {
  if (!html) return { valid: null, mesaj: 'Răspuns gol' };

  const activa = html.match(/activ[aă]|valabil[aă]/i);
  const expirata = html.match(/expir[at]+|nu exist[aă]/i);
  const dates = html.match(/([0-9]{2}[./-][0-9]{2}[./-][0-9]{4})/g);

  if (expirata && !activa) return { valid: false, expira: null, mesaj: 'Nu există rovinieta activă' };
  if (activa && dates) {
    const dataExp = dates[dates.length - 1];
    return { valid: true, expira: dataExp, zileRamase: calcZile(dataExp), mesaj: 'Rovinieta activă', sursa: 'scrape' };
  }

  return { valid: null, mesaj: 'Status rovinieta nedeterminat' };
}

// ═══ HELPERS ═══
function getJudet(nr) {
  const map = {
    'B': 'București', 'AB': 'Alba', 'AR': 'Arad', 'AG': 'Argeș',
    'BC': 'Bacău', 'BH': 'Bihor', 'BN': 'Bistrița-Năsăud', 'BT': 'Botoșani',
    'BV': 'Brașov', 'BR': 'Brăila', 'BZ': 'Buzău', 'CS': 'Caraș-Severin',
    'CL': 'Călărași', 'CJ': 'Cluj', 'CT': 'Constanța', 'CV': 'Covasna',
    'DB': 'Dâmbovița', 'DJ': 'Dolj', 'GL': 'Galați', 'GR': 'Giurgiu',
    'GJ': 'Gorj', 'HR': 'Harghita', 'HD': 'Hunedoara', 'IL': 'Ialomița',
    'IS': 'Iași', 'IF': 'Ilfov', 'MM': 'Maramureș', 'MH': 'Mehedinți',
    'MS': 'Mureș', 'NT': 'Neamț', 'OT': 'Olt', 'PH': 'Prahova',
    'SM': 'Satu Mare', 'SJ': 'Sălaj', 'SB': 'Sibiu', 'SV': 'Suceava',
    'TR': 'Teleorman', 'TM': 'Timiș', 'TL': 'Tulcea', 'VS': 'Vaslui',
    'VL': 'Vâlcea', 'VN': 'Vrancea'
  };
  const prefix = nr.match(/^([A-Z]{1,2})/)?.[1] || '';
  return map[prefix] || null;
}

function extractCookies(cookieHeader) {
  if (!cookieHeader) return '';
  return cookieHeader.split(',').map(c => c.split(';')[0].trim()).join('; ');
}

function formatData(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  } catch { return dateStr; }
}

function calcZile(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return Math.ceil((d - new Date()) / 86400000);
  } catch { return null; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache'
  };
}
