/* datos.js · carga los datos del sitio y arranca la página.
   Fuentes (carpeta /datos):
     horarios.json          → generado por herramientas/build_data.py desde los .xlsm  (NO se edita a mano)
     meta.json              → fecha de generación, periodo y avisos (lo genera el mismo script)
     ambientes.csv          → matriz de laboratorios (misma hoja MATRIZ de Drive: se exporta como CSV y se reemplaza)
     carreras_seccion.csv   → letra inicial de la sección → carrera (SE EDITA en Excel)
   Uso en el HTML:  <script src="assets/js/datos.js" data-app="laboratorios|explorador|portal"></script> */
(function () {
  const APP = document.currentScript.dataset.app;
  const DIAS = { LUN: 0, MAR: 1, MIE: 2, JUE: 3, VIE: 4, SAB: 5, DOM: 6 };

  async function leer(url, v, tipo) {
    const r = await fetch(url + (v ? '?v=' + encodeURIComponent(v) : ''), { cache: v ? 'default' : 'no-cache' });
    if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
    return tipo === 'json' ? r.json() : r.text();
  }

  /* CSV simple con comillas; devuelve array de objetos usando la fila de encabezados */
  function csv(t) {
    t = t.replace(/^\uFEFF/, '');
    const filas = []; let f = [], c = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const x = t[i];
      if (q) { if (x === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += x; }
      else if (x === '"') q = true;
      else if (x === ',' || x === ';') { f.push(c); c = ''; }
      else if (x === '\n' || x === '\r') { if (x === '\r' && t[i + 1] === '\n') i++; f.push(c); c = ''; if (f.some(s => s.trim() !== '')) filas.push(f); f = []; }
      else c += x;
    }
    if (c !== '' || f.length) { f.push(c); if (f.some(s => s.trim() !== '')) filas.push(f); }
    const h = filas.shift().map(s => s.trim().toLowerCase());
    return filas.map(r => Object.fromEntries(h.map((k, i) => [k, (r[i] || '').trim()])));
  }

  function minutos(t) { const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t); return (+m[1] % 12 + (/PM/i.test(m[3]) ? 12 : 0)) * 60 + +m[2]; }
  function rango(t) { const p = t.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi); return [minutos(p[0]), minutos(p[1])]; }

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

  function error(e) {
    const local = location.protocol === 'file:';
    document.body.insertAdjacentHTML('afterbegin', '<div style="margin:24px auto;max-width:720px;padding:16px;border:1px solid #bb0000;border-radius:8px;font:14px/1.5 Arial;background:#fff;color:#32363a">' +
      '<b>No se pudieron cargar los datos.</b><br>' + (local ? 'Abriste la página con doble clic (file://). Los navegadores bloquean la lectura de datos así: usa <code>herramientas/ver_local.bat</code> o publica el sitio.' : 'Revisa que existan los archivos de la carpeta <code>datos/</code>.') +
      '<br><small>' + String(e.message || e) + '</small></div>');
    console.error(e);
  }

  async function cargar() {
    const meta = await leer('datos/meta.json', '', 'json'), v = meta.generado || '';
    let cfg = {}; try { cfg = await leer('datos/config.json', v, 'json'); } catch (_) {}
    const D = APP === 'portal' ? [] : await leer('datos/horarios.json', v, 'json');
    window.META = meta; window.D = D;
    window.PERIODO = cfg.periodo || meta.periodo || '';
    if (APP === 'laboratorios') {
      const [amb, car] = await Promise.all([leer('datos/ambientes.csv', v, 'text'), leer('datos/carreras_seccion.csv', v, 'text')]);
      const r = armarLabs(D, csv(amb));
      window.A = r.A; window.MAT = r.MAT;
      window.CAR = Object.fromEntries(csv(car).map(f => [f.letra, [f.programa, f.carrera]]));
    }
    document.querySelectorAll('[data-periodo]').forEach(n => n.textContent = 'Periodo ' + window.PERIODO);
    const fecha = meta.generado ? new Date(meta.generado).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const pie = document.getElementById('pie');
    if (pie) pie.textContent = APP === 'laboratorios'
      ? 'Laboratorios: matriz de ambientes (' + window.A.labs.length + ') · Horarios y alumnos registrados: archivos de programas del periodo ' + window.PERIODO + ' · Datos actualizados al ' + fecha + '.'
      : 'Datos del periodo ' + window.PERIODO + ' (actualizados al ' + fecha + ') · Los horarios pueden cambiar; confirma siempre en el sistema oficial.';
    document.title = document.title.replace(/·.*$/, '· Pregrado ' + window.PERIODO);
    if (APP !== 'portal') { const s = document.createElement('script'); s.src = 'assets/js/' + APP + '.js'; document.body.appendChild(s); }
  }
  window.cargarDatos = cargar; window.__datos = { csv, rango, armarLabs };
  cargar().catch(error);
})();
