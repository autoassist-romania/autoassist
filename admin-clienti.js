// admin-clienti.js — panou admin: Clienți (AA-000123, căutare după email/telefon/nume) + Jurnal emailuri.
// Vizibil doar pentru autoassist.romania@gmail.com. Datele vin prin RPC-urile admin_search_customers / admin_email_log
// (verifică pe server emailul din JWT, deci nimeni altcineva nu poate citi datele).
// Depinde de: core.js (currentUser, supabaseClient).
(function(){
  var ADMIN = 'autoassist.romania@gmail.com';
  var tab = 'clienti';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function fmt(d){ if(!d) return '—'; try{ return new Date(d).toLocaleString('ro-RO',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return esc(d); } }
  function fmtD(d){ if(!d) return '—'; try{ return new Date(d).toLocaleDateString('ro-RO'); }catch(e){ return esc(d); } }

  function build(){
    if($('sec-admin-clienti')) return;
    var main = document.querySelector('main.main'); if(!main) return;
    var s = document.createElement('section'); s.className='sec'; s.id='sec-admin-clienti';
    s.innerHTML =
      '<button class="back-btn" onclick="goTo(\'dashboard\')">← Înapoi</button>'+
      '<div class="topbar"><div><div class="pt">👥 Clienți & Emailuri</div><div class="ps">Număr client, căutare și dovada emailurilor trimise</div></div></div>'+
      '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
        '<button class="btn btn-primary btn-sm" id="adm-tab-clienti" onclick="aaAdmTab(\'clienti\')">👥 Clienți</button>'+
        '<button class="btn btn-sm" id="adm-tab-emailuri" style="background:var(--s2);color:var(--t1)" onclick="aaAdmTab(\'emailuri\')">✉️ Emailuri trimise</button>'+
      '</div>'+
      '<div class="card" style="margin-bottom:14px"><div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<input class="fi" id="adm-q" style="flex:1;min-width:220px;margin:0" placeholder="Caută: AA-000123, email, telefon sau nume" onkeydown="if(event.key===\'Enter\')aaAdmLoad()">'+
        '<button class="btn btn-primary btn-sm" onclick="aaAdmLoad()">🔍 Caută</button>'+
      '</div><div id="adm-msg" style="font-size:12px;color:var(--t3);margin-top:8px;min-height:16px"></div></div>'+
      '<div class="card" style="padding:0;overflow:hidden;overflow-x:auto"><div id="adm-out" style="padding:12px"></div></div>'+
      '<div class="mo" id="mo-adm-mail"><div class="md" style="max-width:720px"><div class="md-handle"></div>'+
        '<div class="md-h"><div class="md-t">✉️ Email trimis</div><div class="md-x" onclick="closeM(\'adm-mail\')">✕</div></div>'+
        '<div id="adm-mail-meta" style="font-size:12px;color:var(--t2);line-height:1.7;margin-bottom:10px"></div>'+
        '<iframe id="adm-mail-frame" sandbox="" style="width:100%;height:420px;border:1px solid var(--b1);border-radius:10px;background:#fff"></iframe>'+
      '</div></div>';
    main.appendChild(s);
  }

  function addNav(){
    if($('nav-admin-clienti')) return;
    var nav = document.querySelector('aside.sidebar nav.nav'); if(!nav) return;
    var d = document.createElement('div'); d.className='ni'; d.id='nav-admin-clienti';
    d.innerHTML='<span class="ni-i">👥</span>Clienți & Emailuri';
    d.onclick=function(){ aaAdmOpen(); };
    nav.appendChild(d);
    // și în meniul „Mai mult” de pe telefon
    var grid = document.querySelector('#msheet .mgrid');
    if(grid && !$('mitem-admin-clienti')){
      var m=document.createElement('div'); m.className='mitem'; m.id='mitem-admin-clienti';
      m.innerHTML='<div class="mi-i">👥</div><div class="mi-l">Clienți</div>';
      m.onclick=function(){ if(typeof closeMD==='function') closeMD(); aaAdmOpen(); };
      grid.appendChild(m);
    }
  }

  window.aaAdmOpen = function(){
    build();
    document.querySelectorAll('.sec.active').forEach(function(x){ x.classList.remove('active'); });
    var s=$('sec-admin-clienti'); if(s) s.classList.add('active');
    window.scrollTo(0,0);
    aaAdmLoad();
  };

  window.aaAdmTab = function(t){
    tab = t;
    var a=$('adm-tab-clienti'), b=$('adm-tab-emailuri');
    if(a){ a.className = t==='clienti' ? 'btn btn-primary btn-sm' : 'btn btn-sm'; a.style.background = t==='clienti' ? '' : 'var(--s2)'; a.style.color = t==='clienti' ? '' : 'var(--t1)'; }
    if(b){ b.className = t==='emailuri' ? 'btn btn-primary btn-sm' : 'btn btn-sm'; b.style.background = t==='emailuri' ? '' : 'var(--s2)'; b.style.color = t==='emailuri' ? '' : 'var(--t1)'; }
    var q=$('adm-q'); if(q) q.placeholder = t==='clienti' ? 'Caută: AA-000123, email, telefon sau nume' : 'Filtrează: email destinatar, subiect, tip sau AA-000123';
    aaAdmLoad();
  };

  var _mails = [];
  window.aaAdmLoad = async function(){
    var out=$('adm-out'), msg=$('adm-msg'); if(!out) return;
    var q = ($('adm-q')||{}).value || '';
    msg.textContent='Se încarcă…'; out.innerHTML='';
    try{
      if(tab==='clienti'){
        var r = await supabaseClient.rpc('admin_search_customers',{q:q.trim(),lim:100});
        if(r.error) throw r.error;
        var rows=r.data||[];
        msg.textContent = rows.length+' clienți'+(q?' pentru „'+q+'”':'');
        if(!rows.length){ out.innerHTML='<div style="padding:16px;color:var(--t3)">Niciun client găsit.</div>'; return; }
        var h='<table class="tbl"><thead><tr><th>Nr. client</th><th>Nume</th><th>Email</th><th>Telefon</th><th>Plan</th><th>Premium până</th><th>Înregistrat</th><th>Ultima activitate</th></tr></thead><tbody>';
        rows.forEach(function(c){
          var prem = c.plan && c.plan!=='free';
          h+='<tr><td style="font-family:\'JetBrains Mono\';font-weight:700;color:var(--gold)">'+esc(c.customer_code)+'</td>'+
             '<td>'+esc(c.full_name||'—')+'</td><td>'+esc(c.email||'—')+'</td><td>'+esc(c.telefon||'—')+'</td>'+
             '<td>'+(prem?'<span style="color:var(--gold);font-weight:700">👑 '+esc(c.plan)+'</span>':'gratuit')+'</td>'+
             '<td>'+fmtD(c.premium_until)+'</td><td>'+fmtD(c.registered_at)+'</td><td>'+fmt(c.last_active)+'</td></tr>';
        });
        out.innerHTML=h+'</tbody></table>';
      } else {
        var r2 = await supabaseClient.rpc('admin_email_log',{q:q.trim(),lim:100});
        if(r2.error) throw r2.error;
        _mails=r2.data||[];
        msg.textContent = _mails.length+' emailuri'+(q?' pentru „'+q+'”':'')+' (cele mai recente primele)';
        if(!_mails.length){ out.innerHTML='<div style="padding:16px;color:var(--t3)">Niciun email în jurnal.</div>'; return; }
        var h2='<table class="tbl"><thead><tr><th>Data</th><th>Tip</th><th>Către</th><th>Client</th><th>Subiect</th><th>Status</th></tr></thead><tbody>';
        _mails.forEach(function(m,i){
          var ok = m.status==='sent';
          h2+='<tr style="cursor:pointer" onclick="aaAdmMail('+i+')"><td>'+fmt(m.created_at)+'</td>'+
              '<td><span style="font-size:11px;color:var(--t3)">'+esc(m.source)+'</span><br>'+esc(m.kind)+'</td>'+
              '<td>'+esc(m.to_email)+'</td><td style="font-family:\'JetBrains Mono\';color:var(--gold)">'+esc(m.customer_code||'—')+'</td>'+
              '<td>'+esc(m.subject)+'</td>'+
              '<td>'+(ok?'<span style="color:var(--green);font-weight:700">✓ trimis</span>':'<span style="color:var(--red);font-weight:700" title="'+esc(m.error||'')+'">✗ eșuat</span>')+'</td></tr>';
        });
        out.innerHTML=h2+'</tbody></table>';
      }
    }catch(e){
      msg.textContent='';
      out.innerHTML='<div style="padding:16px;color:var(--red)">Eroare: '+esc((e&&e.message)||e)+'</div>';
    }
  };

  window.aaAdmMail = function(i){
    var m=_mails[i]; if(!m) return;
    $('adm-mail-meta').innerHTML =
      '<strong>Subiect:</strong> '+esc(m.subject)+'<br><strong>Către:</strong> '+esc(m.to_email)+
      (m.customer_code?' ('+esc(m.customer_code)+')':'')+'<br><strong>Trimis:</strong> '+fmt(m.created_at)+
      ' · '+esc(m.source)+' / '+esc(m.kind)+'<br><strong>Status:</strong> '+esc(m.status)+
      (m.provider_id?' · ID Resend: '+esc(m.provider_id):'')+(m.error?'<br><span style="color:var(--red)">'+esc(m.error)+'</span>':'');
    $('adm-mail-frame').srcdoc = m.body_html || '<p style="font-family:sans-serif;color:#666">(fără conținut salvat)</p>';
    if(typeof openM==='function') openM('adm-mail');
  };

  var tries=0, t=setInterval(function(){
    tries++; if(tries>150){ clearInterval(t); return; }
    if(typeof currentUser==='undefined' || !currentUser) return;
    clearInterval(t);
    if((currentUser.email||'').toLowerCase()!==ADMIN) return;
    addNav(); build();
  }, 1000);
})();
