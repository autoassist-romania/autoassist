// ═══ SUPPORT CHAT WIDGET ═══
const SC_EDGE = 'https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/support-chat';
const SC_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpz' +
  'cGNrbmp1cWRqZnh0cXJxaGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjM0NzcsImV4cCI6MjA2MDk5OTQ3N30.' +
  'B7BHjW3vXBJGkRLNAHHR8nLsTNk7qxCG2kOj0UmO4U4';

let scOpen = false;
let scHistory = [];
let scEscalated = false;
let scLoading = false;

function scToggle() {
  scOpen = !scOpen;
  const btn = document.getElementById('support-chat-btn');
  const panel = document.getElementById('support-chat-panel');
  if (scOpen) {
    btn.classList.add('sc-open');
    btn.textContent = '✕';
    panel.classList.add('sc-open');
    if (scHistory.length === 0) scWelcome();
    setTimeout(() => document.getElementById('sc-input')?.focus(), 250);
  } else {
    btn.classList.remove('sc-open');
    btn.textContent = '💬';
    panel.classList.remove('sc-open');
  }
}

function scWelcome() {
  const userName = (typeof currentUser !== 'undefined' && currentUser)
    ? (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'utilizator')
    : 'utilizator';
  scAddMsg('bot', `Salut, ${userName}! 👋 Sunt agentul de suport AutoAssist.\n\nCu ce te pot ajuta? Pot răspunde la întrebări despre aplicație, cont, mașini, documente sau orice problemă tehnică.`);
}

function scAddMsg(role, text) {
  const el = document.getElementById('sc-msgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = `sc-msg ${role}`;
  div.textContent = text;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
  if (role !== 'typing') scHistory.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
}

function scShowTyping() {
  const el = document.getElementById('sc-msgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'sc-msg bot sc-typing';
  div.id = 'sc-typing-indicator';
  div.innerHTML = '<span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function scHideTyping() {
  document.getElementById('sc-typing-indicator')?.remove();
}

async function scSend() {
  if (scLoading) return;
  const input = document.getElementById('sc-input');
  const text = input?.value?.trim();
  if (!text) return;
  input.value = '';
  scAddMsg('user', text);
  scLoading = true;
  scShowTyping();

  try {
    const userEmail = (typeof currentUser !== 'undefined' && currentUser?.email) || 'anonim';
    const userCars = (typeof cars !== 'undefined' && cars.length)
      ? cars.map(c => `${c.plate} ${c.brand} ${c.model} ${c.year || ''}`).join(', ')
      : 'nicio mașină în garaj';

    const res = await fetch(SC_EDGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SC_ANON, 'Authorization': 'Bearer ' + SC_ANON },
      body: JSON.stringify({
        messages: scHistory.slice(-10),
        userEmail,
        userCars,
      })
    });

    const data = await res.json();
    scHideTyping();
    const reply = data.reply || 'Îmi pare rău, a apărut o eroare. Încearcă din nou.';
    scAddMsg('bot', reply);

    // Dacă AI-ul nu poate rezolva, afișăm automat butonul de escaladare proeminent
    if (data.needsEscalation) {
      document.getElementById('sc-escalate').style.background = 'rgba(255,79,109,0.18)';
      document.getElementById('sc-escalate').style.borderColor = 'rgba(255,79,109,0.5)';
    }
  } catch (e) {
    scHideTyping();
    scAddMsg('bot', 'Conexiune întreruptă. Verifică internetul și încearcă din nou, sau folosește butonul de mai jos pentru a trimite problema direct la echipă.');
  }
  scLoading = false;
}

async function scEscalate() {
  if (scEscalated) return;
  const btn = document.getElementById('sc-escalate');
  btn.textContent = '⏳ Se trimite...';
  btn.style.opacity = '0.6';

  try {
    const userEmail = (typeof currentUser !== 'undefined' && currentUser?.email) || 'utilizator anonim';
    const convText = scHistory
      .map(m => `[${m.role === 'user' ? 'Utilizator' : 'Agent AI'}]: ${m.content}`)
      .join('\n\n');

    await fetch(SC_EDGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SC_ANON, 'Authorization': 'Bearer ' + SC_ANON },
      body: JSON.stringify({ escalate: true, userEmail, conversation: convText })
    });

    scEscalated = true;
    btn.textContent = '✅ Trimis! Revenim în curând.';
    btn.style.opacity = '1';
    btn.style.color = 'var(--green)';
    btn.style.borderColor = 'rgba(0,200,100,0.3)';
    btn.style.background = 'rgba(0,200,100,0.08)';
    btn.onclick = null;
    scAddMsg('bot', '📧 Problema ta a fost transmisă echipei AutoAssist. Vei primi un răspuns pe email în cel mai scurt timp. Mulțumim pentru răbdare!');
  } catch (e) {
    btn.textContent = '📧 Trimite problema la echipă';
    btn.style.opacity = '1';
  }
}

// Enter în input
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('sc-input');
  if (inp) inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); scSend(); }
  });
});
