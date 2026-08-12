import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ajutor: caută o valoare într-un obiect încercând mai multe nume posibile de câmp
function pick(obj: any, keys: string[]) {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const full = url.searchParams.get('full') === '1';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ═══ 1. Preț mediu național — fără limită de cereri, sigur zilnic ═══
    const resNat = await fetch('https://pretcarburant.ro/api/v1/preturi/minime', {
      headers: { 'User-Agent': 'AutoAssist.ro (contact: autoassist.romania@gmail.com)' }
    });
    const dataNat = await resNat.json();
    const listaPreturi: any[] = dataNat.preturi || dataNat.rezultate || [];

    const findFuel = (tipuri: string[]) =>
      listaPreturi.find((p: any) => tipuri.includes(p.tip || p.combustibil || p.fuel)) || {};

    const benzina = findFuel(['benzina_standard', 'benzina']);
    const motorina = findFuel(['motorina_standard', 'motorina']);
    const gpl = findFuel(['gpl']);

    const { error: errNat } = await supabase.from('fuel_national').upsert({
      id: 1,
      data: dataNat.data || new Date().toISOString().split('T')[0],
      benzina_min: pick(benzina, ['min']), benzina_avg: pick(benzina, ['mediu', 'medie', 'avg']), benzina_max: pick(benzina, ['max']),
      motorina_min: pick(motorina, ['min']), motorina_avg: pick(motorina, ['mediu', 'medie', 'avg']), motorina_max: pick(motorina, ['max']),
      gpl_min: pick(gpl, ['min']), gpl_avg: pick(gpl, ['mediu', 'medie', 'avg']), gpl_max: pick(gpl, ['max']),
      updated_at: new Date().toISOString()
    });

    let statiiCount = 0;
    let statiiEroare = null;

    // ═══ 2. Stații reale cu preț — DOAR o dată pe săptămână (limită API gratuit: 1/săpt) ═══
    if (full) {
      const resStatii = await fetch('https://pretcarburant.ro/api/v1/statii', {
        headers: { 'User-Agent': 'AutoAssist.ro (contact: autoassist.romania@gmail.com)' }
      });
      const dataStatii = await resStatii.json();

      if (dataStatii.status === 'error') {
        statiiEroare = dataStatii.message;
      } else {
        const statii: any[] = dataStatii.statii || dataStatii.rezultate || [];
        const rows = statii.map((s: any) => ({
          id: String(pick(s, ['id', 'station_id'])),
          brand: pick(s, ['brand', 'retea']) || '',
          nume: pick(s, ['nume', 'name']) || pick(s, ['brand']) || '',
          adresa: pick(s, ['adresa', 'address']) || '',
          lat: pick(s, ['lat', 'latitude']),
          lon: pick(s, ['lon', 'lng', 'longitude']),
          benzina_standard: pick(s, ['benzina_standard', 'benzina']),
          motorina_standard: pick(s, ['motorina_standard', 'motorina']),
          gpl: pick(s, ['gpl']),
          updated_at: new Date().toISOString()
        })).filter((r: any) => r.id && r.lat && r.lon);

        // Upsert în batch-uri de 500 (limită practică Supabase)
        for (let i = 0; i < rows.length; i += 500) {
          await supabase.from('fuel_stations').upsert(rows.slice(i, i + 500));
        }
        statiiCount = rows.length;
      }
    }

    return new Response(JSON.stringify({
      ok: true, full, national_ok: !errNat, statii_sincronizate: statiiCount, statii_eroare: statiiEroare
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
