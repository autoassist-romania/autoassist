// cookie-consent.js — banner de consimțământ (GDPR / ePrivacy). Se încarcă din push.js.
// Acum aplicația folosește DOAR stocare strict necesară (autentificare, preferințe, ultima pagină),
// care nu cere acord. Bannerul informează și pregătește consimțământul pentru analitice/reclame, când le adăugăm.
// Folosire în viitor: if(window.aaConsent && aaConsent.analytics()) { /* încarcă Analytics */ }
//                     window.addEventListener('aa-consent', e => { if(e.detail.analytics) { /* încarcă acum */ } });
(function(){
  var KEY='aa_consent', VER=1;
  function read(){ try{ var j=JSON.parse(localStorage.getItem(KEY)||'null'); return (j&&j.v===VER)?j:null; }catch(e){ return null; } }
  function save(an){
    var o={v:VER, analytics:!!an, ts:new Date().toISOString()};
    try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('aa-consent',{detail:o})); }catch(e){}
  }
  window.aaConsent={
    get:function(){ return read(); },
    analytics:function(){ var c=read(); return !!(c&&c.analytics); },
    marketing:function(){ return false; }
  };
  function close(){ var d=document.getElementById('aa-cookie'); if(d) d.remove(); }
  function show(){
    if(document.getElementById('aa-cookie')) return;
    var d=document.createElement('div'); d.id='aa-cookie';
    d.setAttribute('role','dialog'); d.setAttribute('aria-label','Cookie-uri și stocare locală');
    d.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;width:min(620px,94vw);background:#14192b;border:1px solid rgba(240,180,41,.55);border-radius:14px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.6);color:#fff;font-size:13px;line-height:1.5;font-family:inherit';
    d.innerHTML='<div style="font-weight:800;margin-bottom:4px">🍪 Cookie-uri și stocare locală</div>'
      +'<div style="opacity:.88;margin-bottom:10px">Folosim stocarea locală a browserului doar pentru funcționarea aplicației (autentificare, preferințe, ultima pagină vizitată). <b>Nu folosim cookie-uri de publicitate sau de urmărire.</b> Dacă vom adăuga statistici anonime, le pornim doar cu acordul tău. <a href="politica-confidentialitate.html#cookie" target="_blank" rel="noopener" style="color:#f0b429;text-decoration:underline">Politica de confidențialitate</a></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button id="aa-ck-all" style="flex:1 1 160px;padding:10px 12px;border:none;border-radius:9px;background:#f0b429;color:#1a1200;font-weight:800;font-size:13px;cursor:pointer">Accept toate</button>'
      +'<button id="aa-ck-ess" style="flex:1 1 160px;padding:10px 12px;border:1px solid rgba(255,255,255,.25);border-radius:9px;background:transparent;color:#fff;font-weight:700;font-size:13px;cursor:pointer">Doar esențiale</button>'
      +'</div>';
    document.body.appendChild(d);
    document.getElementById('aa-ck-all').onclick=function(){ save(true); close(); };
    document.getElementById('aa-ck-ess').onclick=function(){ save(false); close(); };
  }
  // Permite utilizatorului să-și schimbe alegerea (retragerea consimțământului)
  window.aaCookieSettings=function(){ try{ localStorage.removeItem(KEY); }catch(e){} show(); };
  if(!read()) setTimeout(show, 600);
})();
