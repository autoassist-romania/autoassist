/* AutoAssist — raportul „Datele mele” în format Word (.docx), generat în browser.
   Se încarcă la cerere din flota.js. Folosește biblioteca docx (global `docx`). */
(function (root) {
  'use strict';
  var GOLD = 'B8860B', DARK = '1F2937', GREY = '6B7280', HEAD = 'F6EBC8', LINE = 'D9D4C3', ZEBRA = 'FBF8EE';
  var W = 9638; // lățime utilă A4 cu margini de 2 cm, în DXA

  var LABELS = {
    plate: 'Număr înmatriculare', brand: 'Marcă', model: 'Model', year: 'An', km: 'Kilometraj', added: 'Adăugată la',
    created_at: 'Creat la', email: 'Email', full_name: 'Nume', plan: 'Plan', pret: 'Preț (RON)', descriere: 'Descriere',
    tel: 'Telefon', judet: 'Județ', localitate: 'Localitate', dotari: 'Dotări', status: 'Stare', pachet: 'Pachet',
    pay_kind: 'Tip plată', paid_at: 'Plătit la', expires_at: 'Expiră la', culoare: 'Culoare', combustibil: 'Combustibil',
    cutie_viteze: 'Cutie de viteze', caroserie: 'Caroserie', motor_cm3: 'Motor (cm³)', putere_cp: 'Putere (CP)',
    locuri: 'Locuri', vin: 'Serie șasiu (VIN)', indicatii: 'Indicații', rca: 'RCA', itp: 'ITP', rovinieta: 'Rovinietă',
    extinctor: 'Extinctor', trusa: 'Trusă medicală', trusa_medicala: 'Trusă medicală', data: 'Data', tip: 'Tip',
    cost: 'Cost', suma: 'Sumă', furnizor: 'Furnizor', litri: 'Litri', pret_litru: 'Preț/litru', note: 'Observații',
    nota: 'Observații', expira: 'Expiră', exp: 'Expiră', start: 'Început', sfarsit: 'Sfârșit', valabil: 'Valabil',
    date: 'Data', type: 'Tip', name: 'Nume', value: 'Valoare', day: 'Ziua', price: 'Preț', service: 'Service',
    description: 'Descriere', mileage: 'Kilometraj', amount: 'Sumă', liters: 'Litri'
  };
  var ROLES = { user: 'Tu', assistant: 'Agent AI' };
  var STARI = { activ: 'Activ', in_asteptare: 'În așteptare plată', expirat: 'Expirat', sters: 'Șters' };

  function label(k) {
    if (LABELS[k]) return LABELS[k];
    var s = String(k).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function isIso(s) { return /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s); }
  function fmtDate(v) {
    var s = String(v), d = new Date(s);
    if (isNaN(d)) return s;
    var out = d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (s.length > 10) out += ', ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return out;
  }
  function fv(v, depth) {
    depth = depth || 0;
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Da' : 'Nu';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') {
      if (v.indexOf('data:') === 0 || (v.length > 400 && v.indexOf(' ') < 0)) return '(fișier atașat — se găsește în aplicație)';
      return isIso(v) ? fmtDate(v) : v;
    }
    if (Array.isArray(v)) {
      if (!v.length) return '—';
      return v.map(function (x) { return fv(x, depth + 1); }).join(depth ? '; ' : ', ');
    }
    if (typeof v === 'object') {
      var keys = Object.keys(v);
      if (!keys.length) return '—';
      return keys.map(function (k) { return label(k) + ': ' + fv(v[k], depth + 1); }).join('; ');
    }
    return String(v);
  }

  function run(D, text, o) { o = o || {}; o.text = text; o.font = 'Calibri'; return new D.TextRun(o); }
  function para(D, text, o) {
    o = o || {};
    return new D.Paragraph({
      alignment: o.align, spacing: o.spacing || { after: 80 }, keepNext: o.keepNext, border: o.border,
      children: [run(D, text, { size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color || DARK })]
    });
  }
  function h1(D, text) {
    return new D.Paragraph({
      keepNext: true, spacing: { before: 360, after: 140 },
      border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } },
      children: [run(D, text, { size: 30, bold: true, color: GOLD })]
    });
  }
  function h2(D, text) {
    return new D.Paragraph({ keepNext: true, spacing: { before: 240, after: 100 }, children: [run(D, text, { size: 24, bold: true, color: DARK })] });
  }
  function cell(D, text, width, o) {
    o = o || {};
    var b = { style: D.BorderStyle.SINGLE, size: 4, color: LINE };
    var paras = String(text).split('\n').map(function (line) {
      return new D.Paragraph({ spacing: { after: 20 }, children: [run(D, line, { size: o.size || 19, bold: o.bold, color: o.color || DARK })] });
    });
    return new D.TableCell({
      width: { size: width, type: D.WidthType.DXA },
      margins: { top: 70, bottom: 70, left: 110, right: 110 },
      borders: { top: b, bottom: b, left: b, right: b },
      shading: o.fill ? { type: D.ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
      children: paras
    });
  }
  // tabel cu antet: cols = [{label, w, get(row)}]
  function table(D, cols, rows) {
    var total = cols.reduce(function (a, c) { return a + c.w; }, 0);
    var scale = W / total;
    var ws = cols.map(function (c) { return Math.round(c.w * scale); });
    var trs = [new D.TableRow({
      tableHeader: true, cantSplit: true,
      children: cols.map(function (c, i) { return cell(D, c.label, ws[i], { bold: true, fill: HEAD, size: 19 }); })
    })];
    rows.forEach(function (r, ri) {
      trs.push(new D.TableRow({
        cantSplit: false,
        children: cols.map(function (c, i) { return cell(D, c.get(r), ws[i], { fill: ri % 2 ? ZEBRA : undefined }); })
      }));
    });
    return new D.Table({ width: { size: W, type: D.WidthType.DXA }, columnWidths: ws, rows: trs });
  }
  // tabel „câmp / valoare”
  function kv(D, pairs) {
    var ws = [3000, W - 3000];
    return new D.Table({
      width: { size: W, type: D.WidthType.DXA }, columnWidths: ws,
      rows: pairs.map(function (p) {
        return new D.TableRow({ cantSplit: true, children: [cell(D, p[0], ws[0], { bold: true, fill: HEAD }), cell(D, p[1], ws[1])] });
      })
    });
  }
  function gap(D) { return new D.Paragraph({ spacing: { after: 120 }, children: [] }); }
  function empty(D) { return para(D, 'Nu avem date în această categorie.', { italics: true, color: GREY }); }

  // valoare JSON arbitrară (documente, mentenanță etc.) -> tabel
  function renderJson(D, v) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) return null;
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
      var keys = [];
      v.forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
      keys = keys.slice(0, 7);
      var cols = keys.map(function (k) { return { label: label(k), w: 1, get: function (r) { return fv(r && r[k]); } }; });
      return table(D, cols, v);
    }
    if (typeof v === 'object' && !Array.isArray(v)) {
      return kv(D, Object.keys(v).map(function (k) { return [label(k), fv(v[k])]; }));
    }
    return para(D, fv(v));
  }

  function build(D, data, logo) {
    var kids = [];
    var cont = data.cont || {};
    var when = fmtDate(data.exportat_la || new Date().toISOString());

    // ── Antet ──
    if (logo && logo.bytes) {
      var w = 230, h = Math.round(w * (logo.h / logo.w));
      kids.push(new D.Paragraph({
        alignment: D.AlignmentType.CENTER, spacing: { after: 60 },
        children: [new D.ImageRun({ data: logo.bytes, transformation: { width: w, height: h }, type: 'png' })]
      }));
    }
    kids.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 120, after: 40 }, children: [run(D, 'Datele mele', { size: 52, bold: true, color: GOLD })] }));
    kids.push(para(D, 'Raport cu datele personale păstrate de AutoAssist', { align: D.AlignmentType.CENTER, size: 24, color: GREY, spacing: { after: 200 } }));
    kids.push(kv(D, [['Cont', fv(cont.email)], ['Raport generat la', when], ['Temei', 'Dreptul de portabilitate a datelor — art. 20 din Regulamentul (UE) 2016/679 (GDPR)']]));
    kids.push(gap(D));
    kids.push(para(D, 'În acest document găsești toate informațiile pe care le avem despre tine: contul, mașinile și documentele lor, anunțurile, conversațiile cu asistenții AI, alertele trimise, notificările, apartenența la flote și mesajele către suport. Dacă o categorie nu are date, apare menționat. Un fișier tehnic (JSON) cu aceleași date poate fi descărcat din aplicație, la Setări → Exportă datele mele.', { size: 20, color: GREY }));

    // ── 1. Cont ──
    kids.push(h1(D, '1. Contul tău'));
    kids.push(kv(D, [
      ['Email', fv(cont.email)], ['Cont creat la', fv(cont.creat_la)],
      ['Premium', cont.premium ? 'Da' : 'Nu'], ['Premium valabil până la', cont.premium_pana ? fv(cont.premium_pana) : '—']
    ]));
    var dp = data.date_profil || {};
    if (dp.nume || dp.telefon || dp.localitate) {
      kids.push(gap(D));
      kids.push(kv(D, [['Nume', fv(dp.nume)], ['Telefon', fv(dp.telefon)], ['Localitate', fv(dp.localitate)]]));
    }
    (data.profil || []).forEach(function (p) {
      kids.push(gap(D));
      kids.push(kv(D, [['Nume în profil', fv(p.full_name)], ['Email în profil', fv(p.email)], ['Plan', fv(p.plan)], ['Profil creat la', fv(p.created_at)]]));
    });

    // ── 2. Mașini ──
    kids.push(h1(D, '2. Mașinile tale'));
    var cars = data.masini || [];
    if (!cars.length) kids.push(empty(D));
    cars.forEach(function (c, i) {
      kids.push(h2(D, 'Mașina ' + (i + 1) + ': ' + [c.brand, c.model].filter(Boolean).join(' ') + (c.plate ? ' · ' + c.plate : '')));
      kids.push(kv(D, [
        ['Număr înmatriculare', fv(c.plate)], ['Marcă / model', fv([c.brand, c.model].filter(Boolean).join(' '))],
        ['An fabricație', fv(c.year)], ['Kilometraj', c.km != null ? c.km + ' km' : '—'], ['Adăugată la', fv(c.added || c.created_at)]
      ]));
      [['docs', 'Documente și scadențe'], ['mnt', 'Mentenanță și jurnal'], ['anvelope', 'Anvelope']].forEach(function (s) {
        var t = renderJson(D, c[s[0]]);
        if (t) { kids.push(para(D, s[1], { bold: true, size: 21, spacing: { before: 160, after: 60 }, keepNext: true })); kids.push(t); }
      });
      kids.push(gap(D));
    });

    // ── 3. Anunțuri ──
    kids.push(h1(D, '3. Anunțurile tale de vânzare'));
    var ls = data.anunturi || [];
    if (!ls.length) kids.push(empty(D));
    ls.forEach(function (l, i) {
      kids.push(h2(D, 'Anunț ' + (i + 1) + ': ' + [l.brand, l.model, l.year].filter(Boolean).join(' ')));
      var pairs = [
        ['Stare', STARI[l.status] || fv(l.status)], ['Pachet', fv(l.pachet)], ['Preț', l.pret != null ? l.pret + ' RON' : '—'],
        ['Număr înmatriculare', fv(l.plate)], ['Kilometraj', l.km != null ? l.km + ' km' : '—'],
        ['Combustibil / cutie / caroserie', [l.combustibil, l.cutie_viteze, l.caroserie].filter(Boolean).join(' · ') || '—'],
        ['Motor / putere', [l.motor_cm3 ? l.motor_cm3 + ' cm³' : '', l.putere_cp ? l.putere_cp + ' CP' : ''].filter(Boolean).join(' · ') || '—'],
        ['Culoare / locuri', [l.culoare, l.locuri ? l.locuri + ' locuri' : ''].filter(Boolean).join(' · ') || '—'], ['Serie șasiu (VIN)', fv(l.vin)],
        ['Locație', [l.localitate, l.judet].filter(Boolean).join(', ') || '—'], ['Telefon afișat', fv(l.tel)],
        ['Descriere', fv(l.descriere)], ['Dotări', fv(l.dotari)], ['Indicații', fv(l.indicatii)],
        ['Poze încărcate', Array.isArray(l.fotos) ? String(l.fotos.length) : (l.foto ? '1' : '0')],
        ['Plătit la', fv(l.paid_at)], ['Publicat la', fv(l.created_at)], ['Expiră la', fv(l.expires_at)]
      ];
      kids.push(kv(D, pairs));
      kids.push(gap(D));
    });

    // ── 4. Conversații ──
    kids.push(h1(D, '4. Conversațiile cu asistenții AI'));
    var ch = data.conversatii_agenti || [];
    if (!ch.length) kids.push(empty(D));
    else kids.push(table(D, [
      { label: 'Data', w: 1500, get: function (r) { return fv(r.data); } },
      { label: 'Asistent', w: 1100, get: function (r) { return fv(r.agent); } },
      { label: 'Cine', w: 900, get: function (r) { return ROLES[r.rol] || fv(r.rol); } },
      { label: 'Mesaj', w: 6100, get: function (r) { return fv(r.mesaj); } }
    ], ch));

    // ── 5. Alerte și utilizare ──
    kids.push(h1(D, '5. Alerte și utilizare'));
    kids.push(h2(D, 'Alerte de expirare trimise'));
    var al = data.alerte_trimise || [];
    kids.push(al.length ? table(D, [
      { label: 'Trimis la', w: 1800, get: function (r) { return fv(r.trimis_la); } },
      { label: 'Document', w: 1600, get: function (r) { return fv(r.document); } },
      { label: 'Scadență', w: 1500, get: function (r) { return fv(r.scadenta); } },
      { label: 'Zile rămase', w: 1200, get: function (r) { return fv(r.zile_ramase); } }
    ], al) : empty(D));
    kids.push(h2(D, 'Mesaje trimise asistenților, pe zile'));
    var us = data.utilizare_ai_zilnic || [];
    kids.push(us.length ? table(D, [
      { label: 'Ziua', w: 1, get: function (r) { return fv(r.zi); } },
      { label: 'Număr mesaje', w: 1, get: function (r) { return fv(r.mesaje); } }
    ], us) : empty(D));
    kids.push(h2(D, 'Anunțuri gratuite folosite'));
    var fr = data.anunturi_gratuite_folosite || [];
    kids.push(fr.length ? table(D, [
      { label: 'An', w: 1, get: function (r) { return fv(r.an); } },
      { label: 'Folosit la', w: 2, get: function (r) { return fv(r.data); } }
    ], fr) : empty(D));

    // ── 6. Notificări ──
    kids.push(h1(D, '6. Notificări pe dispozitive'));
    var ps = data.dispozitive_notificari_push || [];
    kids.push(ps.length ? table(D, [
      { label: 'Dispozitiv / browser', w: 6200, get: function (r) { return fv(r.dispozitiv); } },
      { label: 'Activat la', w: 2200, get: function (r) { return fv(r.activat_la); } }
    ], ps) : empty(D));

    // ── 7. Flote ──
    kids.push(h1(D, '7. Flote'));
    kids.push(h2(D, 'Flote create de tine'));
    var fl = data.flote_detinute || [];
    kids.push(fl.length ? table(D, [
      { label: 'Nume', w: 2400, get: function (r) { return fv(r.nume); } },
      { label: 'Plan', w: 1200, get: function (r) { return fv(r.plan); } },
      { label: 'Stare', w: 1200, get: function (r) { return STARI[r.status] || fv(r.status); } },
      { label: 'Valabilă până la', w: 1800, get: function (r) { return fv(r.valabila_pana); } },
      { label: 'Creată la', w: 1800, get: function (r) { return fv(r.creata_la); } }
    ], fl) : empty(D));
    kids.push(h2(D, 'Flote din care faci parte'));
    var mb = data.apartenenta_flote || [];
    kids.push(mb.length ? table(D, [
      { label: 'Email', w: 3000, get: function (r) { return fv(r.email); } },
      { label: 'Rol', w: 1200, get: function (r) { return fv(r.rol); } },
      { label: 'Invitat la', w: 2000, get: function (r) { return fv(r.invitat_la); } },
      { label: 'Acceptat la', w: 2000, get: function (r) { return fv(r.acceptat_la); } }
    ], mb) : empty(D));

    // ── 8. Suport ──
    kids.push(h1(D, '8. Mesaje către suport'));
    var sp = data.mesaje_suport || [];
    kids.push(sp.length ? table(D, [
      { label: 'Primit la', w: 1700, get: function (r) { return fv(r.primit_la); } },
      { label: 'Subiect', w: 2600, get: function (r) { return fv(r.subiect); } },
      { label: 'Răspunsul nostru', w: 5300, get: function (r) { return fv(r.raspuns); } }
    ], sp) : empty(D));

    kids.push(h1(D, 'Ce nu apare în acest raport'));
    kids.push(para(D, 'Facturile și datele de plată cu cardul sunt păstrate de procesatorul de plăți Stripe (noi nu vedem și nu stocăm numărul cardului); le găsești în portalul de abonament, din Setări → Abonamentul meu. Pentru orice întrebare despre datele tale ne poți scrie la autoassist.romania@gmail.com.', { size: 20, color: GREY }));

    var footer = new D.Footer({
      children: [new D.Paragraph({
        alignment: D.AlignmentType.CENTER,
        border: { top: { style: D.BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [
          run(D, 'AutoAssist SRL · autoassist.ro · autoassist.romania@gmail.com   |   Pagina ', { size: 16, color: GREY }),
          new D.TextRun({ children: [D.PageNumber.CURRENT], size: 16, color: GREY, font: 'Calibri' }),
          run(D, ' din ', { size: 16, color: GREY }),
          new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], size: 16, color: GREY, font: 'Calibri' })
        ]
      })]
    });

    return new D.Document({
      creator: 'AutoAssist', title: 'Datele mele — AutoAssist', description: 'Export GDPR al datelor personale',
      styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
        footers: { default: footer },
        children: kids
      }]
    });
  }

  root.AAExportDocx = { build: build, fmtDate: fmtDate };
  if (typeof module !== 'undefined') module.exports = root.AAExportDocx;
})(typeof window !== 'undefined' ? window : globalThis);
