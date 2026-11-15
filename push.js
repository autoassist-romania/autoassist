// push.js — notificări push pe telefon/computer (apar sus pe ecran chiar dacă aplicația e închisă).
// Depinde de: core.js (currentUser, supabaseClient, showNotification). Service Worker: sw-cache.js.
(function(){
  var VAPID_PUBLIC = 'BDmBKJyhZBHwN85gKHv0i6DTgBApXtWXFvsR9dHIbpuTL7PQ8Nk_s0jc7K5j8pVIa3rTMgLX6bhKNkGt8Jx46nU';
  function b64ToU8(b64){
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var s = atob((b64 + pad).replace(/-/g,'+').replace(/_/g,'/'));
    var a = new Uint8Array(s.length); for(var i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a;
  }
  function el(id){ return document.getElementById(id); }
  function setStatus(html){ var e = el('notif-status'); if(e) e.innerHTML = html; }
  function supported(){ return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window); }
  function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); }
  function isStandalone(){ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }

  async function getReg(){
    var reg = await navigator.serviceWorker.getRegistration('/');
    if(!reg) reg = await navigator.serviceWorker.register('/sw-cache.js');
    await navigator.serviceWorker.ready;
    return reg;
  }

  async function saveSub(sub){
    var j = sub.toJSON();
    var r = await supabaseClient.rpc('push_register', {
      p_endpoint: j.endpoint,
      p_p256dh: j.keys && j.keys.p256dh,
      p_auth: j.keys && j.keys.auth,
      p_ua: (navigator.userAgent||'').slice(0,200)
    });
    return r && r.error ? r.error : null;
  }

  window.aaPushEnable = async function(){
    if(!currentUser || !supabaseClient){ setStatus('⚠️ <span style="color:var(--amber)">Intră mai întâi în cont.</span>'); return; }
    if(!supported()){
      setStatus(isIOS() && !isStandalone()
        ? '📲 <span style="color:var(--amber)">Pe iPhone, instalează mai întâi aplicația: Share → „Add to Home Screen", apoi deschide-o de pe ecranul principal și apasă din nou.</span>'
        : '❌ <span style="color:var(--red)">Browserul tău nu suportă notificări push.</span>');
      return;
    }
    if(isIOS() && !isStandalone()){
      setStatus('📲 <span style="color:var(--amber)">Pe iPhone, notificările merg doar din aplicația instalată: Share → „Add to Home Screen", apoi deschide aplicația de pe ecranul principal.</span>');
      return;
    }
    try{
      var perm = await Notification.requestPermission();
      if(perm !== 'granted'){ setStatus('❌ <span style="color:var(--red)">Notificările sunt blocate.</span> Activează-le din setările browserului/telefonului pentru autoassist.ro.'); return; }
      var reg = await getReg();
      var sub = await reg.pushManager.getSubscription();
      if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: b64ToU8(VAPID_PUBLIC) });
      var err = await saveSub(sub);
      if(err){ console.error('push_subscriptions:', err); setStatus('⚠️ <span style="color:var(--red)">Nu am putut salva abonarea. Încearcă din nou.</span>'); return; }
      setStatus('✅ <span style="color:var(--green)">Notificările push sunt active pe acest dispozitiv.</span> Vei fi alertat când documentele expiră.');
      try{ await reg.showNotification('AutoAssist', { body:'Notificările sunt activate. Te anunțăm înainte să expire RCA, ITP sau rovinieta.', icon:'/icon-192.png', badge:'/icon-32.png', tag:'aa-welcome' }); }catch(e){}
      await aaPushRefreshStatus();
    }catch(e){
      console.error('aaPushEnable', e);
      setStatus('⚠️ <span style="color:var(--red)">Nu am putut activa notificările.</span> Încearcă din nou.');
    }
  };

  window.aaPushDisable = async function(){
    try{
      var reg = await navigator.serviceWorker.getRegistration('/');
      var sub = reg && await reg.pushManager.getSubscription();
      if(sub){
        var ep = sub.endpoint;
        await sub.unsubscribe();
        if(currentUser && supabaseClient) await supabaseClient.from('push_subscriptions').delete().eq('endpoint', ep);
      }
      setStatus('🔕 Notificările push sunt oprite pe acest dispozitiv.');
      await aaPushRefreshStatus();
    }catch(e){ console.error('aaPushDisable', e); }
  };

  window.aaPushRefreshStatus = async function(){
    var btn = el('push-toggle-btn'); if(!btn) return;
    try{
      if(!supported()){ btn.textContent = 'Activează notificările'; btn.onclick = aaPushEnable; return; }
      var reg = await navigator.serviceWorker.getRegistration('/');
      var sub = reg && await reg.pushManager.getSubscription();
      var on = !!sub && Notification.permission === 'granted';
      btn.textContent = on ? 'Oprește notificările' : 'Activează notificările';
      btn.onclick = on ? aaPushDisable : aaPushEnable;
      if(on) setStatus('✅ <span style="color:var(--green)">Notificările push sunt active pe acest dispozitiv.</span>');
    }catch(e){}
  };

  // butonul vechi din Setări ("Activează notificările") ajunge aici
  window.requestNotifPermission = function(){ return window.aaPushEnable(); };

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(aaPushRefreshStatus, 600); });
})();
