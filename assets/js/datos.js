/* datos.js · carga los datos del sitio y arranca la página. Solo HTML + CSS + JavaScript (sin Python).
   Fuentes (se definen en datos/config.json → "fuentes"; pueden ser archivos locales o enlaces CSV de Google Sheets):
     horarios   → hoja "Horarios" (una fila por bloque horario; la genera importador.html desde los .xlsm)
     ambientes  → hoja "Ambientes" (matriz de laboratorios: N°, Programa de Estudio, Acronimo, LABORATORIO O TALLER, AMBIENTE, SEDE)
     secciones  → hoja "Secciones" (letra inicial de la sección → programa y carrera)
   Uso en el HTML:  <script src="assets/js/datos.js" data-app="laboratorios|explorador|portal"></script> */
(function () {
  const APP = document.currentScript.dataset.app;
  const DIAS = { LUN: 0, MAR: 1, MIE: 2, JUE: 3, VIE: 4, SAB: 5, DOM: 6 };
  const LOCAL = { horarios: 'datos/horarios.csv', ambientes: 'datos/ambientes.csv', secciones: 'datos/carreras_seccion.csv' };

  async function leer(url, tipo) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(url.slice(0, 80) + ' → HTTP ' + r.status);
    return tipo === 'json' ? r.json() : r.text();
  }

  /* Lee una fuente; si es un enlace de Google Sheets y falla, usa la copia local de datos/ y deja un aviso */
  async function fuente(nombre, url, avisos) {
    if (/\/spreadsheets\/d\/[^/]+\/(edit|view)/.test(url || ''))
      avisos.push('El enlace de "' + nombre + '" es el de edición de Google Sheets. Usa Archivo ▸ Compartir ▸ Publicar en la web ▸ CSV.');
    try {
      const t = await leer(url || LOCAL[nombre], 'text');
      if (/^\s*<(!doctype|html)/i.test(t)) throw new Error('la respuesta no es un CSV (¿hoja no publicada?)');
      return t;
    } catch (e) {
      if (!url || url === LOCAL[nombre]) throw e;
      avisos.push('No se pudo leer "' + nombre + '" desde Google Sheets (' + (e.message || e) + '). Se muestra la copia local.');
      return leer(LOCAL[nombre], 'text');
    }
  }

  /* CSV simple con comillas; separador coma o punto y coma (se detecta en el encabezado); usa la fila de encabezados */
  function csv(t) {
    t = t.replace(/^\uFEFF/, '');
    const l1 = t.split(/\r?\n/, 1)[0], sep = (l1.split(';').length > l1.split(',').length) ? ';' : ',';
    const filas = []; let f = [], c = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const x = t[i];
      if (q) { if (x === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += x; }
      else if (x === '"') q = true;
      else if (x === sep) { f.push(c); c = ''; }
      else if (x === '\n' || x === '\r') { if (x === '\r' && t[i + 1] === '\n') i++; f.push(c); c = ''; if (f.some(s => s.trim() !== '')) filas.push(f); f = []; }
      else c += x;
    }
    if (c !== '' || f.length) { f.push(c); if (f.some(s => s.trim() !== '')) filas.push(f); }
    const h = filas.shift().map(s => s.trim().toLowerCase());
    return filas.map(r => Object.fromEntries(h.map((k, i) => [k, (r[i] || '').trim()])));
  }

  function minutos(t) { const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t); return (+m[1] % 12 + (/PM/i.test(m[3]) ? 12 : 0)) * 60 + +m[2]; }
  function rango(t) { const p = t.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi); return [minutos(p[0]), minutos(p[1])]; }

  /* Filas planas de la hoja "Horarios" → estructura D: programas → cursos → secciones → bloques */
  function armarD(filas, avisos) {
    const P = new Map(), C = new Map(), S = new Map();
    let periodo = '', ignoradas = 0;
    const num = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
    for (const f of filas) {
      const k = (f.programa || '').toUpperCase(), cc = f.curso || '', nrc = parseInt(f.nrc, 10);
      if (!k || !cc || isNaN(nrc)) { ignoradas++; continue; }
      periodo = f.periodo || periodo;
      let p = P.get(k); if (!p) { p = { k, n: f.programa_nombre || k, c: [] }; P.set(k, p); }
      const kc = k + '|' + cc; let c = C.get(kc); if (!c) { c = { c: cc, n: f.curso_nombre || '', s: [] }; C.set(kc, c); p.c.push(c); }
      const ks = kc + '|' + nrc; let s = S.get(ks);
      if (!s) {
        s = { nrc, sec: f.secc || '', idl: f.id_liga || null, l: f.liga || null, cr: num(f.cred), h: num(f.h), ht: num(f.ht), pp: num(f.pp),
          cap: num(f.capa), reg: num(f.regi), blq: f.bloque || 'NO', mod: f.modalidad || '', m: [] };
        S.set(ks, s); c.s.push(s);
      }
      if (f.pabe && f.aula) {
        const dia = (f.dia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
        const idd = /^\d+$/.test(f.id_docente || '') ? parseInt(f.id_docente, 10) : (f.id_docente || '');
        s.m.push([f.pabe, f.aula, dia, f.hora || '', idd, f.docente || '']);
        if (!(dia in DIAS) || !/\d{1,2}:\d{2}\s*(AM|PM)/i.test(f.hora || '')) { ignoradas++; s.m.pop(); }
      }
    }
    if (ignoradas) avisos.push(ignoradas + ' fila(s) de la hoja "Horarios" se ignoraron (falta programa, curso o NRC, o el día/hora no tiene el formato esperado).');
    return { D: [...P.values()], periodo };
  }

  /* Une horarios (D) con la matriz de ambientes y arma la estructura que usa la página de laboratorios */
  function armarLabs(D, filas) {
    const lim = t => String(t || '').replace(/\s+/g, ' ').trim();   // acepta el formato de la hoja MATRIZ (N°, Programa de Estudio, Acronimo, LABORATORIO O TALLER, AMBIENTE, SEDE)
    const labs = filas.map(f => {
      const amb = lim(f['ambiente']);
      return { id: +(f['n°'] || f['id']), a: lim(f['acronimo']), p: lim(f['programa de estudio']), n: lim(f['laboratorio o taller']), amb, s: lim(f['sede']), rooms: amb.split(/\s*-\s*/).filter(Boolean), ev: [] };
    });
    const todas = new Set(labs.flatMap(l => l.rooms)), porAula = new Map();
    const lab_de = aula => {                       // aula exacta, o aula + una letra (GL101 → GL101A / GL101B)
      if (porAula.has(aula)) return porAula.get(aula);
      let r = [];
      for (const l of labs) for (const s of l.rooms)
        if (aula === s || (!todas.has(aula) && aula.startsWith(s) && aula.length === s.length + 1 && /[A-Za-z]/.test(aula.slice(-1)) && /\d/.test(s.slice(-1)))) { r.push(l); break; }
      porAula.set(aula, r); return r;
    };
    const idx = new Map(), MAT = {};
    for (const p of D) for (const c of p.c) for (const s of c.s) {
      MAT[s.nrc] = s.reg;
      for (const m of s.m) for (const l of lab_de(m[1])) {
        const [a, b] = rango(m[3]), d = DIAS[m[2]], k = l.id + '|' + d + '|' + a + '|' + b + '|' + m[1] + '|' + s.nrc;
        let e = idx.get(k);
        if (!e) { e = [d, a, b, m[1], s.nrc, c.c, c.n, s.sec, [], []]; idx.set(k, e); l.ev.push(e); }
        if (!e[8].includes(m[5])) e[8].push(m[5]);
        if (!e[9].includes(p.k)) e[9].push(p.k);
      }
    }
    labs.forEach(l => l.ev.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0) || x[4] - y[4]));
    const progs = [], vistos = new Set();
    labs.forEach(l => { if (!vistos.has(l.a)) { vistos.add(l.a); progs.push({ k: l.a, n: l.p }); } });
    return { A: { labs, progs }, MAT };
  }


  /* Portada: lee solo el inicio de la hoja "Horarios" para saber el periodo (no descarga todo) */
  async function periodoRapido(url) {
    try {
      const r = await fetch(url || LOCAL.horarios, { cache: 'no-store' }), rd = r.body.getReader(), dec = new TextDecoder();
      let t = '';
      while (t.split(/\r?\n/).length < 3) { const x = await rd.read(); if (x.done) break; t += dec.decode(x.value, { stream: true }); }
      rd.cancel();
      const f = csv(t.split(/\r?\n/).slice(0, 2).join('\n'));
      return (f[0] && f[0].periodo) || '';
    } catch (_) { return ''; }
  }

  function aviso(lista) {
    if (!lista.length) return;
    document.body.insertAdjacentHTML('afterbegin', '<div style="margin:12px auto;max-width:900px;padding:10px 14px;border:1px solid #e9730c;border-radius:8px;font:13px/1.5 Arial;background:#fff8f0;color:#32363a"><b>Avisos de datos</b><br>' +
      lista.map(s => '• ' + String(s).replace(/</g, '&lt;')).join('<br>') + '</div>');
  }

  function error(e) {
    const local = location.protocol === 'file:';
    document.body.insertAdjacentHTML('afterbegin', '<div style="margin:24px auto;max-width:720px;padding:16px;border:1px solid #bb0000;border-radius:8px;font:14px/1.5 Arial;background:#fff;color:#32363a">' +
      '<b>No se pudieron cargar los datos.</b><br>' + (local ? 'Abriste la página con doble clic (file://). Los navegadores bloquean la lectura de datos así: publica el sitio (GitHub Pages) o ábrelo desde un servidor local.' : 'Revisa que <code>datos/config.json</code> tenga enlaces correctos y que las hojas de Google estén publicadas como CSV.') +
      '<br><small>' + String(e.message || e) + '</small></div>');
    console.error(e);
  }

  async function cargar() {
    const avisos = [];
    let cfg = {}; try { cfg = await leer('datos/config.json', 'json'); } catch (_) {}
    const fu = Object.assign({}, LOCAL, cfg.fuentes || {});
    for (const k of Object.keys(fu)) if (!fu[k]) fu[k] = LOCAL[k];
    const remoto = Object.keys(fu).some(k => /^https?:/i.test(fu[k]));
    let D = [], periodo = cfg.periodo || '';
    if (APP === 'portal') { if (!periodo) periodo = await periodoRapido(fu.horarios); }
    else { const r = armarD(csv(await fuente('horarios', fu.horarios, avisos)), avisos); D = r.D; periodo = periodo || r.periodo; }
    window.D = D; window.PERIODO = periodo;
    window.META = { generado: new Date().toISOString(), avisos, origen: remoto ? 'Google Sheets' : 'archivos locales' };
    if (APP === 'laboratorios') {
      const [amb, car] = await Promise.all([fuente('ambientes', fu.ambientes, avisos), fuente('secciones', fu.secciones, avisos)]);
      const r = armarLabs(D, csv(amb));
      window.A = r.A; window.MAT = r.MAT;
      window.CAR = Object.fromEntries(csv(car).map(f => [f.letra, [f.programa, f.carrera]]));
    }
    document.querySelectorAll('[data-periodo]').forEach(n => n.textContent = 'Periodo ' + window.PERIODO);
    const ahora = new Date().toLocaleString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const pie = document.getElementById('pie');
    if (pie) pie.textContent = (APP === 'laboratorios'
      ? 'Laboratorios: matriz de ambientes (' + window.A.labs.length + ') · Horarios y alumnos registrados del periodo ' + window.PERIODO
      : 'Datos del periodo ' + window.PERIODO) + ' · Origen: ' + window.META.origen + ' · Leído el ' + ahora + ' · Los horarios pueden cambiar; confirma siempre en el sistema oficial.';
    document.title = document.title.replace(/·.*$/, '· Pregrado ' + window.PERIODO);
    aviso(avisos);
    if (APP !== 'portal') { const s = document.createElement('script'); s.src = 'assets/js/' + APP + '.js'; document.body.appendChild(s); }
  }
  window.cargarDatos = cargar; window.__datos = { csv, rango, armarLabs, armarD };
  cargar().catch(error);
})();
