import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_KEY = () => Deno.env.get('ANTHROPIC_API_KEY') || '';
const RESEND_KEY = () => Deno.env.get('RESEND_API_KEY') || '';
const SUPPORT_EMAIL = 'autoassist.romania@gmail.com';
const FROM_EMAIL = 'support@autoassist.ro';

const SYSTEM_PROMPT = `Ești agentul de suport AutoAssist — platforma de management auto #1 din România.
Răspunzi în română, concis și prietenos. Știi totul despre AutoAssist:

FUNCȚII PRINCIPALE:
- Garaj virtual: adaugă mașini, scanează talon cu OCR, documente RCA/ITP/Rovinietă/Extinctor/Trusă
- Agenți AI: 6 agenți specializați (Manager, Auto, Documente, Juridic, Vânzare, ITP) — 5 msg/zi gratuit
- Vânzare mașini: marketplace propriu, anunțuri cu 9 poze, badge documente verificate
- Mentenanță: jurnal service, reminder-uri km (ulei, filtre, distribuție etc), jurnal combustibil
- Anvelope: stare set curent, presiune, uzură, calendar sezonier
- Documente personale: buletin, permis, talon scanat
- Servicii: RCA, ITP, Rovinietă, CarVertical, asistență rutieră, piese auto
- Premium 49 RON/an: mașini nelimitate, alerte SMS, AI nelimitat, export PDF

PROBLEME COMUNE ȘI SOLUȚII:
- "Nu văd mașina": verifică dacă ești logat, apasă Garajul Meu în sidebar
- "OCR nu funcționează": asigură-te că poza talonului e clară, bifează acordul GDPR
- "Agentul AI nu răspunde": refresh pagina, verifică limita de 5 mesaje/zi gratuit
- "Nu primesc alertele": verifică secțiunea Setări → Notificări
- "Eroare la login Google": încearcă login email/parolă ca alternativă

Dacă nu poți rezolva problema utilizatorului sau e o problemă tehnică gravă (bug, eroare de plată, cont blocat), răspunde că vei escalada și adaugă exact "[[ESCALATE]]" la finalul răspunsului tău.

Nu fabrica informații. Dacă nu știi, spune că trimiți la echipă.`;

async function callClaude(messages: any[]): Promise<{ reply: string; needsEscalation: boolean }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || 'Îmi pare rău, a apărut o eroare.';
  const needsEscalation = text.includes('[[ESCALATE]]');
  return { reply: text.replace('[[ESCALATE]]', '').trim(), needsEscalation };
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY()) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY()}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();

    // ── ESCALADARE din widget chat ──────────────────────────────
    if (body.escalate) {
      const { userEmail, conversation } = body;
      await sendEmail(
        SUPPORT_EMAIL,
        `🆘 Suport AutoAssist — Escaladare de la ${userEmail}`,
        `<div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#4f7dff">Solicitare suport escaladată</h2>
          <p><strong>Utilizator:</strong> ${userEmail}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('ro-RO')}</p>
          <hr>
          <h3>Conversație:</h3>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:13px">${conversation}</pre>
          <p style="color:#888;font-size:12px">AutoAssist Support System</p>
        </div>`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── EMAIL INBOUND de la Resend webhook ──────────────────────
    if (body.type === 'inbound_email') {
      const { from, subject, text, html } = body;
      const fromEmail = from?.address || from || 'unknown';
      const fromName = from?.name || fromEmail;
      const emailText = text || (html ? html.replace(/<[^>]+>/g, '') : '');

      const { reply, needsEscalation } = await callClaude([
        { role: 'user', content: `Email de la ${fromName} (${fromEmail}):\nSubiect: ${subject}\n\n${emailText}` }
      ]);

      // Reply automat către utilizator
      await sendEmail(
        fromEmail,
        `Re: ${subject}`,
        `<div style="font-family:sans-serif;max-width:600px">
          <div style="background:linear-gradient(135deg,#4f7dff,#7c5cfc);padding:20px;border-radius:12px 12px 0 0">
            <h2 style="color:#fff;margin:0">🚗 AutoAssist România</h2>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Suport Clienți</p>
          </div>
          <div style="padding:24px;background:#1a1a2e;border-radius:0 0 12px 12px">
            <p style="color:#e0e0e0">Salut, ${fromName}!</p>
            <div style="color:#e0e0e0;line-height:1.7">${reply.replace(/\n/g, '<br>')}</div>
            ${needsEscalation ? `<div style="margin-top:20px;padding:14px;background:rgba(79,125,255,0.1);border-radius:8px;color:#4f7dff;font-size:13px">
              📞 Un coleg din echipă te va contacta în curând pentru a rezolva problema.
            </div>` : ''}
            <hr style="border-color:#333;margin:20px 0">
            <p style="color:#888;font-size:12px">AutoAssist — Platforma auto #1 în România<br>
            <a href="https://autoassist.ro" style="color:#4f7dff">autoassist.ro</a></p>
          </div>
        </div>`
      );

      // Forward intern dacă nu poate rezolva
      if (needsEscalation) {
        await sendEmail(
          SUPPORT_EMAIL,
          `📧 Email client nerezolvat — ${fromEmail}: ${subject}`,
          `<div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#ff4f6d">Email client necesită intervenție manuală</h2>
            <p><strong>De la:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
            <p><strong>Subiect:</strong> ${subject}</p>
            <hr>
            <h3>Mesajul original:</h3>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px">${emailText}</div>
            <h3 style="color:#4f7dff">Răspuns trimis automat de AI:</h3>
            <div style="background:#e8f0fe;padding:16px;border-radius:8px">${reply}</div>
            <p style="color:#888;font-size:12px">AutoAssist Support System</p>
          </div>`
        );
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── CHAT WIDGET normal ──────────────────────────────────────
    const { messages, userEmail, userCars } = body;
    const msgsWithCtx = [...(messages || [])];
    if (msgsWithCtx.length > 0 && userCars) {
      msgsWithCtx[0] = {
        ...msgsWithCtx[0],
        content: `[Context: utilizator ${userEmail || 'anonim'}, mașini: ${userCars}]\n\n${msgsWithCtx[0].content}`
      };
    }

    const { reply, needsEscalation } = await callClaude(msgsWithCtx);
    return new Response(JSON.stringify({ reply, needsEscalation }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
