// flota.js — conturi de flotă: membri, vehicule comune, raport pe flotă, plată (Stripe) și activare automată
// Depinde de: core.js (currentUser, cars, supabaseClient, showNotification, aaAuthHeader, AA_ANON_JWT, BILLING_LIVE)
(function(){
  'use strict';
  var FN_URL = 'https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/stripe-billing';
  var PLAN_INFO = {
    fleet_s:{name:'Flotă S',range:'6–10 vehicule',price:349},
    fleet_m:{name:'Flotă M',range:'11–30 vehicule',price:799},
    fleet_l:{name:'Flotă L',range:'31–50 vehicule',price:1299},
    fleet_xl:{name:'Flotă XL',range:'51–100 vehicule',price:2199}
  };
  var DOC_LABELS = [['rca','RCA'],['itp','ITP'],['rov','Rovinietă'],['ext','Extinctor'],['trz','Trusă']];
  var ERR = {
    not_allowed:'Nu ai drepturi de administrator sau abonamentul flotei nu este activ.',
    email_invalid:'Email invalid.', role_invalid:'Rol invalid.',
    members_full:'Ai atins numărul maxim de utilizatori al pachetului.',
    already_in_fleet:'Acest email este deja într-o flotă.',
    cannot_remove_owner:'Proprietarul flotei nu poate fi scos sau modificat.',
    cannot_change_owner:'Proprietarul flotei nu poate fi modificat.',
    name_invalid:'Numele flotei trebuie să aibă între 2 și 80 de caractere.'
  };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function $(id){ return document.getElementById(id); }
  function note(t,b){ if(typeof showNotification==='function') showNotification(t,b); }
  function errText(e){ var m=(e&&e.message)||''; for(var k in ERR){ if(m.indexOf(k)>=0) return ERR[k]; } return 'A apărut o eroare. Încearcă din nou.'; }
  function fmtDate(d){ if(!d) return '—'; try{ return new Date(d).toLocaleDateString('ro-RO'); }catch(e){ return '—'; } }

  // ── Încarcă „flota mea" (apelată de loadUserData la fiecare login) ──
  window.myFleet = null;
  window.loadMyFleet = async function(userId){
    try{
      if(!supabaseClient) return null;
      var r = await supabaseClient.rpc('my_fleet');
      if(r.error){ console.log('my_fleet:', r.error.message); window.myFleet=null; }
      else if(r.data){ window.myFleet = Object.assign({}, r.data, {_uid: userId || (currentUser&&currentUser.id)}); }
      else window.myFleet = null;
    }catch(e){ window.myFleet = null; }
    try{ await afterBilling(); }catch(e){}
    try{ if(typeof aaRefreshPlanLabel==='function') aaRefreshPlanLabel(); }catch(e){}
    try{ applyBillingUI(); }catch(e){}
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    return window.myFleet;
  };

  // ── După întoarcerea de la Stripe: aștept webhook-ul și reîmprospătez contul ──
  async function afterBilling(){
    var b=null; try{ b=sessionStorage.getItem('aa_billing'); }catch(e){}
    if(!b) return;
    try{ sessionStorage.removeItem('aa_billing'); }catch(e){}
    if(b==='listing_cancel'){ note('ℹ️','Plata anunțului a fost anulată. Anunțul rămâne salvat; îl poți plăti din lista ta de anunțuri.'); return; }
    if(b==='listing_ok'){
      note('⏳','Plată primită. Public anunțul...');
      var gata=false;
      for(var k=0;k<10 && !gata;k++){
        try{
          var res = await supabaseClient.from('listings').select('id,status').eq('user_id',currentUser.id).eq('status','in_asteptare');
          if(res.data && res.data.length===0){ gata=true; break; }
        }catch(e){}
        await new Promise(function(r){ setTimeout(r,2500); });
      }
      if(typeof vanzLoadLista==='function') vanzLoadLista();
      note(gata?'✅':'ℹ️', gata ? 'Anunțul tău este publicat. Mulțumim!' : 'Plata e înregistrată; publicarea durează mai mult sau ai alte anunțuri în așteptare. Verifică lista de anunțuri în câteva minute.');
      return;
    }
    if(b!=='success'){ note('ℹ️','Plata a fost anulată. Nu s-a retras nimic.'); return; }
    note('⏳','Plată primită. Activez contul...');
    for(var i=0;i<24;i++){
      try{
        var s = await supabaseClient.auth.refreshSession();
        if(s && s.data && s.data.user) currentUser = s.data.user;
        try{ var g = await supabaseClient.auth.getUser(); if(g && g.data && g.data.user){ currentUser = g.data.user; } }catch(e2){}
        var r = await supabaseClient.rpc('my_fleet');
        if(r.data) window.myFleet = Object.assign({}, r.data, {_uid: currentUser.id});
        if(isPremium()){ note('✅','Contul tău este activ. Mulțumim!'); try{ if(typeof updateUserUI==='function') updateUserUI(currentUser); }catch(e3){} try{ if(typeof aaRefreshPlanLabel==='function') aaRefreshPlanLabel(); }catch(e4){} try{ applyBillingUI(); }catch(e5){} if(typeof renderAll==='function') renderAll(); if(window.myFleet && typeof goTo==='function') goTo('flota'); return; }
      }catch(e){}
      await new Promise(function(r){ setTimeout(r,2500); });
    }
    note('ℹ️','Plata e înregistrată, dar activarea durează mai mult. Reîncarcă aplicația în câteva minute.');
  }

  // ── Plată Stripe ──
  window.billingCheckout = async function(plan, fleetName){
    if(!currentUser){ note('🔐','Autentifică-te mai întâi.'); if(typeof goTo==='function') goTo('landing'); return; }
    try{
      var r = await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':AA_ANON_JWT,'Authorization':await aaAuthHeader()},body:JSON.stringify({action:'checkout',plan:plan,fleetName:fleetName||''})});
      var j = await r.json().catch(function(){return {};});
      if(j.url){ window.location.href = j.url; return; }
      if(r.status===503 || j.error==='not_configured'){ showSoon('Plata online','Plata online se activează în curând. Poți trimite o cerere de ofertă și te contactăm.'); return; }
      if(j.error==='already_premium'){ note('✅','Ai deja Premium activ.'); return; }
      if(j.error==='already_in_fleet'){ note('ℹ️','Faci deja parte dintr-o flotă activă.'); return; }
      note('⚠️','Nu am putut porni plata. Încearcă din nou.');
    }catch(e){ note('⚠️','Eroare de rețea. Încearcă din nou.'); }
  };
  window.billingListingCheckout = async function(listingId){
    if(!currentUser){ note('🔐','Autentifică-te mai întâi.'); return; }
    try{
      var r = await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':AA_ANON_JWT,'Authorization':await aaAuthHeader()},body:JSON.stringify({action:'listing_checkout',listing_id:String(listingId)})});
      var j = await r.json().catch(function(){return {};});
      if(j.url){ window.location.href = j.url; return; }
      if(r.status===503 || j.error==='not_configured'){ showSoon('Plata anunțului','Plata online se activează în curând. Anunțul tău e salvat.'); return; }
      if(j.error==='already_active'){ note('✅','Anunțul este deja activ.'); if(typeof vanzLoadLista==='function') vanzLoadLista(); return; }
      note('⚠️','Nu am putut porni plata. Încearcă din nou.');
    }catch(e){ note('⚠️','Eroare de rețea. Încearcă din nou.'); }
  };
  window.billingPortal = async function(){
    try{
      var r = await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':AA_ANON_JWT,'Authorization':await aaAuthHeader()},body:JSON.stringify({action:'portal'})});
      var j = await r.json().catch(function(){return {};});
      if(j.url){ window.location.href=j.url; return; }
      note('ℹ️', j.error==='no_customer' ? 'Abonamentul acesta nu e gestionat prin Stripe. Scrie-ne la autoassist.romania@gmail.com.' : 'Nu am putut deschide portalul.');
    }catch(e){ note('⚠️','Eroare de rețea.'); }
  };
  window.fleetPay = function(){
    var t = ($('fl-tier')||{}).value;
    if(!PLAN_INFO['fleet_'+t]){ note('ℹ️','Alege un pachet de la 6 la 100 de vehicule.'); return; }
    billingCheckout('fleet_'+t, ($('fl-pay-name')||{}).value);
  };

  // ── Starea inițială a paginii (vânzare) ──
  function updatePayBlock(){
    var box=$('fl-pay'); if(!box) return;
    var t=($('fl-tier')||{}).value, p=PLAN_INFO['fleet_'+t];
    var show = (typeof BILLING_LIVE!=='undefined' && BILLING_LIVE) && !!p && !!currentUser;
    box.style.display = show ? 'block' : 'none';
    var ft=document.querySelector('#fl-form .ct'); if(ft && typeof BILLING_LIVE!=='undefined' && BILLING_LIVE) ft.textContent='Ai nevoie întâi de ofertă sau factură proformă?';
    if(show){ $('fl-pay-sum').textContent = p.name+' · '+p.range+' · '+p.price.toLocaleString('ro-RO')+' RON / an'; }
  }
  var _pick = window.fleetPickTier;
  window.fleetPickTier = function(id){ if(_pick) _pick(id); updatePayBlock(); };

  // ── Raport pe flotă ──
  function daysTo(dateStr){
    if(!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
    var a=Date.parse(String(dateStr).slice(0,10)+'T00:00:00Z'), n=new Date(); var b=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());
    return Math.round((a-b)/86400000);
  }
  function fleetCars(){
    var f=window.myFleet; if(!f) return [];
    return (typeof cars!=='undefined'?cars:[]).filter(function(c){ return c.fleet_id===f.id; });
  }
  function buildReport(){
    var rows = fleetCars().map(function(c){
      var d={}, worst=null, missing=0, expired=0, soon=0;
      DOC_LABELS.forEach(function(x){
        var v=(c.docs||{})[x[0]]; var n=daysTo(v); d[x[0]]={date:v||'',days:n};
        if(n===null){ if(x[0]!=='ext'&&x[0]!=='trz') missing++; }
        else { if(n<0) expired++; else if(n<=30) soon++; if(worst===null||n<worst) worst=n; }
      });
      return {car:c,docs:d,worst:worst,expired:expired,soon:soon,missing:missing};
    });
    rows.sort(function(a,b){ var x=a.worst===null?99999:a.worst, y=b.worst===null?99999:b.worst; return x-y; });
    return rows;
  }
  function chip(n,date){
    if(n===null) return '<span style="color:var(--t3)">—</span>';
    var col = n<0 ? '#e5484d' : n<=30 ? '#f5a623' : '#2fb36b';
    var txt = n<0 ? 'expirat ('+Math.abs(n)+' z)' : n===0 ? 'AZI' : n+' zile';
    return '<span title="'+esc(date)+'" style="color:'+col+';font-weight:700;white-space:nowrap">'+txt+'</span><div style="font-size:10px;color:var(--t3)">'+esc(String(date).slice(0,10))+'</div>';
  }
  var _filter='all';
  window.fleetSetFilter = function(v){ _filter=v; renderReport(); };
  function renderReport(){
    var box=$('fl-report'); if(!box) return;
    var rows=buildReport(), total=rows.length;
    var exp=rows.reduce(function(s,r){return s+r.expired;},0), soon=rows.reduce(function(s,r){return s+r.soon;},0), miss=rows.reduce(function(s,r){return s+r.missing;},0);
    var vis = rows.filter(function(r){ return _filter==='all' || r.expired>0 || r.soon>0 || r.missing>0; });
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:12px">'
      +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:24px;font-weight:800">'+total+'</div><div style="font-size:11px;color:var(--t3)">vehicule</div></div>'
      +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:24px;font-weight:800;color:#e5484d">'+exp+'</div><div style="font-size:11px;color:var(--t3)">documente expirate</div></div>'
      +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:24px;font-weight:800;color:#f5a623">'+soon+'</div><div style="font-size:11px;color:var(--t3)">expiră în 30 zile</div></div>'
      +'<div class="card" style="text-align:center;padding:12px"><div style="font-size:24px;font-weight:800;color:var(--t2)">'+miss+'</div><div style="font-size:11px;color:var(--t3)">fără dată (RCA/ITP/rov.)</div></div></div>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
      +'<select class="fl-in" style="width:auto;margin:0" onchange="fleetSetFilter(this.value)"><option value="all"'+(_filter==='all'?' selected':'')+'>Toate vehiculele</option><option value="issues"'+(_filter==='issues'?' selected':'')+'>Doar cu probleme</option></select>'
      +'<button class="btn btn-sm" onclick="fleetExportCsv()">⬇️ Export CSV</button>'
      +'<button class="btn btn-sm" onclick="fleetPrint()">🖨️ Tipărește</button></div>';
    if(!total){ h+='<div class="empty"><div class="ei">🚚</div><h3>Nu sunt vehicule în flotă</h3><p>Adaugă vehicule din Garaj sau mută-le pe cele personale din tab-ul Abonament.</p></div>'; }
    else {
      h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="text-align:left;color:var(--t3)"><th style="padding:8px">Vehicul</th>'+DOC_LABELS.map(function(x){return '<th style="padding:8px">'+x[1]+'</th>';}).join('')+'</tr></thead><tbody>';
      vis.forEach(function(r){
        var c=r.car;
        h+='<tr style="border-top:1px solid rgba(255,255,255,.08)"><td style="padding:8px"><b>'+esc(c.plate)+'</b><div style="font-size:11px;color:var(--t3)">'+esc([c.brand,c.model].filter(Boolean).join(' '))+(c.km?' · '+Number(c.km).toLocaleString('ro-RO')+' km':'')+'</div></td>'
          +DOC_LABELS.map(function(x){ var d=r.docs[x[0]]; return '<td style="padding:8px">'+chip(d.days,d.date)+'</td>'; }).join('')+'</tr>';
      });
      h+='</tbody></table></div>';
      if(!vis.length) h+='<div style="padding:14px;color:var(--green);font-weight:700">✓ Nicio problemă la documente.</div>';
    }
    box.innerHTML=h;
  }
  window.fleetExportCsv = function(){
    var rows=buildReport();
    var lines=[['Nr. înmatriculare','Marca','Model','Km'].concat(DOC_LABELS.map(function(x){return x[1]+' (data)';})).concat(DOC_LABELS.map(function(x){return x[1]+' (zile)';}))];
    rows.forEach(function(r){ var c=r.car; lines.push([c.plate,c.brand||'',c.model||'',c.km||''].concat(DOC_LABELS.map(function(x){return r.docs[x[0]].date;})).concat(DOC_LABELS.map(function(x){var n=r.docs[x[0]].days;return n===null?'':n;}))); });
    var csv='﻿'+lines.map(function(l){return l.map(function(v){v=String(v==null?'':v);return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(',');}).join('\r\n');
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='raport-flota-'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){document.body.removeChild(a);},500);
  };
  window.fleetPrint = function(){
    var rows=buildReport(), f=window.myFleet||{};
    var h='<html><head><meta charset="utf-8"><title>Raport flotă</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left}.r{color:#c00;font-weight:700}.o{color:#d98200;font-weight:700}.g{color:#198754}</style></head><body><h2>Raport flotă — '+esc(f.name)+'</h2><p>Data: '+new Date().toLocaleDateString('ro-RO')+'</p><table><tr><th>Vehicul</th>'+DOC_LABELS.map(function(x){return '<th>'+x[1]+'</th>';}).join('')+'</tr>';
    rows.forEach(function(r){ var c=r.car; h+='<tr><td><b>'+esc(c.plate)+'</b> '+esc([c.brand,c.model].filter(Boolean).join(' '))+'</td>'+DOC_LABELS.map(function(x){var d=r.docs[x[0]],n=d.days; if(n===null) return '<td>—</td>'; var cl=n<0?'r':n<=30?'o':'g'; return '<td class="'+cl+'">'+esc(String(d.date).slice(0,10))+'<br>'+(n<0?'expirat':n+' zile')+'</td>';}).join('')+'</tr>'; });
    h+='</table><script>window.onload=function(){window.print()}<\/script></body></html>';
    var w=window.open('', '_blank'); if(!w){ note('⚠️','Permite ferestrele pop-up pentru tipărire.'); return; } w.document.write(h); w.document.close();
  };

  // ── Membri ──
  async function renderMembers(){
    var box=$('fl-members'); if(!box) return; var f=window.myFleet; var admin = f.role==='admin' && f.active;
    box.innerHTML='<div style="color:var(--t3)">Se încarcă...</div>';
    var r = await supabaseClient.from('fleet_members').select('id,email,role,user_id,accepted_at').eq('fleet_id', f.id).order('id');
    if(r.error){ box.innerHTML='<div style="color:#e5484d">Nu am putut încărca membrii.</div>'; return; }
    var list=r.data||[];
    var h='<div style="font-size:12px;color:var(--t3);margin-bottom:8px">Utilizatori: '+list.length+' / '+f.max_members+'</div>';
    list.forEach(function(m){
      var owner = m.user_id && m.user_id===f.owner_id;
      h+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0;border-top:1px solid rgba(255,255,255,.08)">'
        +'<div style="flex:1;min-width:160px"><div style="font-weight:700;word-break:break-all">'+esc(m.email)+(owner?' 👑':'')+'</div><div style="font-size:11px;color:var(--t3)">'+(m.user_id?'Activ':'Invitat — așteaptă înregistrarea')+'</div></div>';
      if(admin && !owner){
        h+='<select class="fl-in" style="width:auto;margin:0" onchange="fleetSetRole('+m.id+',this.value)"><option value="driver"'+(m.role==='driver'?' selected':'')+'>Șofer</option><option value="admin"'+(m.role==='admin'?' selected':'')+'>Administrator</option></select>'
          +'<button class="btn btn-sm" onclick="fleetRemove('+m.id+')">Scoate</button>';
      } else h+='<div style="font-size:12px;color:var(--t2)">'+(m.role==='admin'?'Administrator':'Șofer')+'</div>';
      h+='</div>';
    });
    if(admin){
      h+='<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12)"><div style="font-weight:700;margin-bottom:8px">Invită un utilizator</div>'
        +'<input id="fl-inv-email" class="fl-in" type="email" placeholder="Email-ul colegului" maxlength="120">'
        +'<select id="fl-inv-role" class="fl-in"><option value="driver">Șofer (vede vehiculele și actualizează date)</option><option value="admin">Administrator (gestionează flota)</option></select>'
        +'<button class="btn btn-gold btn-full" onclick="fleetInvite()">Trimite invitația</button>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:6px">Persoana intră în flotă automat când se înregistrează sau se loghează în AutoAssist cu acest email (emailul trebuie confirmat).</div></div>';
    }
    box.innerHTML=h;
  }
  window.fleetInvite = async function(){
    var em=($('fl-inv-email')||{}).value, ro=($('fl-inv-role')||{}).value||'driver';
    var r = await supabaseClient.rpc('fleet_invite',{p_email:em,p_role:ro});
    if(r.error){ note('⚠️',errText(r.error)); return; }
    var link='https://www.autoassist.ro';
    note('✅','Invitație salvată. Spune-i colegului să se înregistreze sau să se logheze pe '+link+' cu emailul '+em+'.');
    renderMembers();
  };
  window.fleetRemove = async function(id){
    if(!confirm('Scoți această persoană din flotă?')) return;
    var r=await supabaseClient.rpc('fleet_remove_member',{p_member_id:id}); if(r.error){ note('⚠️',errText(r.error)); return; }
    renderMembers();
  };
  window.fleetSetRole = async function(id,role){
    var r=await supabaseClient.rpc('fleet_set_role',{p_member_id:id,p_role:role}); if(r.error){ note('⚠️',errText(r.error)); }
    renderMembers();
  };
  window.fleetLeave = async function(){
    if(!confirm('Părăsești flota? Nu vei mai vedea vehiculele ei.')) return;
    var r=await supabaseClient.rpc('fleet_leave'); if(r.error){ note('⚠️',errText(r.error)); return; }
    window.myFleet=null;
    if(currentUser && typeof loadUserData==='function') await loadUserData(currentUser.id);
    if(typeof renderAll==='function') renderAll(); renderFlota();
  };
  window.fleetRename = async function(){
    var n=($('fl-rename')||{}).value; var r=await supabaseClient.rpc('fleet_rename',{p_name:n});
    if(r.error){ note('⚠️',errText(r.error)); return; } window.myFleet.name=n.trim(); note('✅','Numele flotei a fost schimbat.'); renderFlota();
  };
  window.fleetMoveMine = async function(){
    var r=await supabaseClient.rpc('fleet_move_my_cars'); if(r.error){ note('⚠️',errText(r.error)); return; }
    var d=r.data||{}; note(d.full?'ℹ️':'✅', d.full?'Flota a atins limita de vehicule.':'Am mutat '+(d.moved||0)+' vehicule în flotă.');
    if(currentUser) await loadUserData(currentUser.id); renderFlota();
  };
  window.fleetAddCar = function(){ if(typeof goTo==='function') goTo('garaj'); setTimeout(function(){ if(typeof openM==='function') openM('add-car'); },200); };

  function renderSub(){
    var box=$('fl-sub'); if(!box) return; var f=window.myFleet, admin=f.role==='admin';
    var h='<div class="card"><div class="ch"><span class="ct">Abonament</span></div>'
      +'<div style="font-size:13px;line-height:1.9">Pachet: <b>'+esc((PLAN_INFO[f.plan]||{name:f.plan}).name)+'</b><br>Vehicule: <b>'+f.cars+' / '+f.max_cars+'</b><br>Utilizatori: <b>maxim '+f.max_members+'</b><br>Stare: <b style="color:'+(f.active?'var(--green)':'#e5484d')+'">'+(f.active?'activ':'expirat')+'</b><br>Valabil până la: <b>'+fmtDate(f.valid_until)+'</b></div>';
    if(!f.active) h+='<div style="margin-top:8px;color:#e5484d;font-size:13px">Abonamentul a expirat: vezi datele, dar nu poți adăuga vehicule sau utilizatori până la reînnoire.</div>';
    if(f.is_owner){
      h+='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
      if(typeof BILLING_LIVE!=='undefined' && BILLING_LIVE) h+='<button class="btn btn-gold btn-sm" onclick="billingPortal()">Gestionează abonamentul / facturi</button>';
      h+='<a class="btn btn-sm" style="color:inherit;text-decoration:none;display:inline-block" href="mailto:autoassist.romania@gmail.com?subject=Flotă%20—%20schimbare%20pachet">Schimbă pachetul</a></div>';
    }
    h+='</div>';
    if(admin && f.active){
      h+='<div class="card" style="margin-top:12px"><div class="ch"><span class="ct">Gestionare</span></div>'
        +'<input id="fl-rename" class="fl-in" value="'+esc(f.name)+'" maxlength="80"><button class="btn btn-sm" onclick="fleetRename()">Redenumește flota</button>'
        +'<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-gold btn-sm" onclick="fleetAddCar()">➕ Adaugă vehicul</button><button class="btn btn-sm" onclick="fleetMoveMine()">Mută mașinile mele personale în flotă</button></div></div>';
    }
    if(!f.is_owner) h+='<div style="margin-top:12px"><button class="btn btn-sm" onclick="fleetLeave()">Părăsește flota</button></div>';
    box.innerHTML=h;
  }

  var _tab='raport';
  window.fleetTab = function(t){ _tab=t; ['raport','membri','abonament'].forEach(function(x){ var p=$('fl-p-'+x), b=$('fl-t-'+x); if(p) p.style.display=x===t?'block':'none'; if(b) b.classList.toggle('btn-gold',x===t); });
    if(t==='raport') renderReport(); if(t==='membri') renderMembers(); if(t==='abonament') renderSub(); };

  window.renderFlota = function(){
    var man=$('flota-manage'), sales=$('flota-sales'); if(!man||!sales) return;
    var f=window.myFleet;
    if(f && currentUser && f._uid===currentUser.id){
      sales.style.display='none'; man.style.display='block';
      man.innerHTML='<div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><div style="flex:1"><div style="font-size:18px;font-weight:800">🚚 '+esc(f.name)+'</div><div style="font-size:12px;color:var(--t3)">Rolul tău: '+(f.role==='admin'?'Administrator':'Șofer')+' · '+(PLAN_INFO[f.plan]||{name:f.plan}).name+'</div></div></div>'
        +'<div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap"><button id="fl-t-raport" class="btn btn-sm" onclick="fleetTab(\'raport\')">Raport</button><button id="fl-t-membri" class="btn btn-sm" onclick="fleetTab(\'membri\')">Utilizatori</button><button id="fl-t-abonament" class="btn btn-sm" onclick="fleetTab(\'abonament\')">Abonament</button></div>'
        +'<div id="fl-p-raport"><div id="fl-report"></div></div><div id="fl-p-membri" style="display:none"><div id="fl-members"></div></div><div id="fl-p-abonament" style="display:none"><div id="fl-sub"></div></div></div>';
      fleetTab(_tab);
    } else {
      man.style.display='none'; sales.style.display='block'; updatePayBlock();
    }
  };

  // ── Etichetă dinamică pentru butonul Premium ──
  function applyBillingUI(){
    var b=$('prem-buy-btn'); if(!b) return;
    var live=(typeof BILLING_LIVE!=='undefined' && BILLING_LIVE);
    var u=(typeof currentUser!=='undefined' && currentUser) ? currentUser : null;
    var am=(u && u.app_metadata) || {};
    var prem=(typeof isPremium==='function') && isPremium();
    var st=$('prem-status');
    if(!st){ st=document.createElement('div'); st.id='prem-status'; st.style.cssText='font-size:12px;color:var(--green);margin:0 0 10px;text-align:center;font-weight:700;display:none'; b.parentNode.insertBefore(st,b); }
    if(prem){
      var until=''; try{ if(am.premium_until) until=new Date(am.premium_until).toLocaleDateString('ro-RO'); }catch(e){}
      if(am.stripe_customer && live){
        b.textContent='⚙️ Gestionează abonamentul / facturi / anulare';
        b.onclick=function(){ billingPortal(); };
        st.textContent='✅ Ești Premium'+(until?' · valabil până la '+until:''); st.style.display='block';
      } else {
        b.textContent=(window.myFleet && window.myFleet.active) ? '✅ Premium activ prin flotă' : '✅ Premium activ';
        b.onclick=function(){};
        st.style.display='none';
      }
      return;
    }
    st.style.display='none';
    b.onclick=function(){ cumpPrem(); };
    if(live) b.textContent='👑 Activează Premium — 99 RON/an · 2 luni incluse gratis';
  }
  window.applyBillingUI=applyBillingUI;
  document.addEventListener('DOMContentLoaded', applyBillingUI);
  if(document.readyState!=='loading') applyBillingUI();

  // ── Întoarcere de la Stripe: pornește activarea imediat ce utilizatorul e conectat ──
  // (loadUserData poate rula înainte să se încarce acest fișier; așa nu se mai pierde ?billing=success)
  (function waitBillingReturn(){
    var b=null; try{ b=sessionStorage.getItem('aa_billing'); }catch(e){}
    if(!b) return;
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      var ready = (typeof supabaseClient!=='undefined' && supabaseClient) && (typeof currentUser!=='undefined' && currentUser);
      var still=null; try{ still=sessionStorage.getItem('aa_billing'); }catch(e){}
      if(!still){ clearInterval(iv); return; }          // l-a consumat deja loadMyFleet
      if(ready){ clearInterval(iv); try{ afterBilling(); }catch(e){} return; }
      if(tries>60) clearInterval(iv);                   // ~30 s
    },500);
  })();

  // ── Ștergerea contului (GDPR) ──
  window.deleteAccountOpen = function(){
    if(!currentUser){ note('🔐','Autentifică-te mai întâi.'); return; }
    var old=$('aa-del-modal'); if(old) old.remove();
    var m=document.createElement('div'); m.id='aa-del-modal';
    m.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px';
    m.innerHTML='<div class="card" style="max-width:420px;width:100%;border:1px solid rgba(239,68,68,.5)">'
      +'<div class="ct" style="margin-bottom:10px">🗑️ Ștergi definitiv contul?</div>'
      +'<p style="font-size:13px;color:var(--t2);margin-bottom:10px">Se șterg mașinile, documentele, anunțurile, conversațiile cu agenții și notificările. Abonamentul Premium se anulează imediat, fără rambursare. <strong>Nu se poate anula.</strong></p>'
      +'<p style="font-size:12px;color:var(--t3);margin-bottom:10px">Facturile plătite rămân păstrate de procesatorul de plăți, conform obligațiilor contabile.</p>'
      +'<div class="fg"><label class="fl">Scrie STERGE pentru confirmare</label><input class="fi" id="aa-del-input" autocomplete="off" placeholder="STERGE"></div>'
      +'<div id="aa-del-msg" style="font-size:12px;color:var(--red);min-height:16px;margin-bottom:8px"></div>'
      +'<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="deleteAccountClose()">Renunț</button>'
      +'<button class="btn" id="aa-del-go" style="flex:1;background:var(--red);color:#fff" onclick="deleteAccountDo()">Șterge definitiv</button></div></div>';
    document.body.appendChild(m);
  };
  window.deleteAccountClose = function(){ var m=$('aa-del-modal'); if(m) m.remove(); };
  window.deleteAccountDo = async function(){
    var inp=$('aa-del-input'), msg=$('aa-del-msg'), go=$('aa-del-go');
    if(!inp || inp.value.trim().toUpperCase()!=='STERGE'){ if(msg) msg.textContent='Scrie exact STERGE ca să confirmi.'; return; }
    if(go){ go.disabled=true; go.textContent='Se șterge…'; }
    try{
      var r = await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':AA_ANON_JWT,'Authorization':await aaAuthHeader()},body:JSON.stringify({action:'delete_account',confirm:'STERGE'})});
      var j = await r.json().catch(function(){return {};});
      if(j.ok){
        try{ localStorage.clear(); sessionStorage.clear(); }catch(e){}
        try{ await supabaseClient.auth.signOut(); }catch(e){}
        document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:sans-serif;background:#0b1220;color:#fff"><div><div style="font-size:42px;margin-bottom:12px">✅</div><div style="font-size:18px;font-weight:700;margin-bottom:8px">Contul a fost șters</div><div style="font-size:14px;opacity:.75;margin-bottom:18px">Datele tale au fost eliminate. Mulțumim că ai folosit AutoAssist.</div><a href="/" style="color:#f0b429">Înapoi la pagina principală</a></div></div>';
        return;
      }
      var t = j.error==='owns_fleet' ? 'Ai o flotă activă. Anulează mai întâi abonamentul flotei din secțiunea Flotă, apoi poți șterge contul.'
            : j.error==='protected_account' ? 'Acest cont este protejat și nu poate fi șters din aplicație.'
            : j.error==='confirm_required' ? 'Scrie STERGE ca să confirmi.'
            : 'Nu am putut șterge contul. Încearcă din nou sau scrie-ne la autoassist.romania@gmail.com.';
      if(msg) msg.textContent=t;
      if(go){ go.disabled=false; go.textContent='Șterge definitiv'; }
    }catch(e){
      if(msg) msg.textContent='Eroare de rețea. Încearcă din nou.';
      if(go){ go.disabled=false; go.textContent='Șterge definitiv'; }
    }
  };
})();
