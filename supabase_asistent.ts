import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getWeather(city: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3&lang=ro`);
    return (await res.text()).trim();
  } catch(e) { return ''; }
}

async function doWebSearch(query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const d = await res.json();
    const parts: string[] = [];
    if(d.AbstractText) parts.push(d.AbstractText);
    if(d.Answer) parts.push(d.Answer);
    if(d.RelatedTopics) d.RelatedTopics.slice(0,4).forEach((t: any) => { if(t.Text) parts.push(t.Text); });
    return parts.join(' | ').slice(0, 1200);
  } catch(e) { return ''; }
}

// Convertesc mesajele din formatul Claude (role/content string) în formatul Gemini (role/parts)
function toGeminiContents(messages: any[]): any[] {
  return messages
    .filter((m: any) => typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

async function callGemini(GEMINI_API_KEY: string, systemMsg: string, finalMessages: any[], max_tokens: number) {
  const contents = toGeminiContents(finalMessages);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemMsg }] },
        tools: [{ google_search: {} }],
        generationConfig: {
          maxOutputTokens: max_tokens || 1024,
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
    }
  );
  const data = await res.json();
  const reply = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: any) => (p.thought ? '' : p.text || ''))
    .join('')
    .trim();
  if (!reply) throw new Error(data?.error?.message || 'Gemini: răspuns gol');
  return reply;
}

async function callClaude(ANTHROPIC_API_KEY: string, model: string, systemMsg: string, finalMessages: any[], max_tokens: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: max_tokens || 1024, system: systemMsg, messages: finalMessages }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Eroare Claude');
  return (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, system, systemPrompt, question, model, max_tokens, searchQuery, weatherCity } = body;

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    let finalMessages = messages && messages.length > 0 ? messages : [{ role: 'user', content: question || '' }];

    // Adaug context web dacă e cerut (doar pentru mesaje text simple)
    const lastMsg = finalMessages[finalMessages.length - 1];
    const isTextOnly = typeof lastMsg?.content === 'string';

    if(isTextOnly) {
      const extraCtx: string[] = [];
      if (weatherCity) { const w = await getWeather(weatherCity); if(w) extraCtx.push(`Vreme actuală: ${w}`); }
      if (searchQuery) { const s = await doWebSearch(searchQuery); if(s) extraCtx.push(`Info web: ${s}`); }
      if(extraCtx.length > 0) lastMsg.content = lastMsg.content + `\n\n[${extraCtx.join(' | ')}]`;
    }

    const systemMsg = (system || systemPrompt || 'Ești un asistent pentru șoferii români. Răspunzi în română.')
      + ' Exprimă-te corect gramatical, natural și clar în limba română. Verifică informațiile înainte să le dai — dacă nu ești sigur de un detaliu, spune că nu ești sigur, nu inventa.';
    const hasImage = finalMessages.some((m: any) => Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image'));

    // Imaginile (OCR talon etc) merg mereu pe Claude Sonnet — Gemini e doar pentru chat text + vocal
    if (hasImage || model === 'claude-sonnet-4-5') {
      if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      const reply = await callClaude(ANTHROPIC_API_KEY, 'claude-sonnet-4-5', systemMsg, finalMessages, max_tokens);
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Chat text + vocal — Gemini cu Google Search grounding (informații reale, nu inventate)
    if (GEMINI_API_KEY) {
      try {
        const reply = await callGemini(GEMINI_API_KEY, systemMsg, finalMessages, max_tokens);
        return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (geminiErr) {
        console.error('Gemini a eșuat, fallback pe Claude:', geminiErr);
        // fallback mai jos
      }
    }

    // Fallback: Claude Haiku (dacă Gemini nu e configurat sau a picat)
    if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    const reply = await callClaude(ANTHROPIC_API_KEY, model || 'claude-haiku-4-5-20251001', systemMsg, finalMessages, max_tokens);
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
