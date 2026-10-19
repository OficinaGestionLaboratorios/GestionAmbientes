/* importador-nucleo.js · convierte las hojas de un archivo de programa (.xlsm) en filas planas.
   No depende del navegador: recibe filas ya leídas (arreglos) y devuelve datos. Se usa desde importador.html. */
(function (raiz) {
  const COLUMNAS = ['periodo', 'programa', 'programa_nombre', 'curso', 'curso_nombre', 'nrc', 'secc', 'id_liga', 'liga',
    'cred', 'h', 'ht', 'pp', 'capa', 'regi', 'bloque', 'modalidad', 'pabe', 'aula', 'dia', 'hora', 'id_docente', 'docente'];
  const HDR = /^\s*(\w+)\s*-\s*\(\s*([\w-]+)\s*\)\s*(.*)$/;
  const PERIODO = /PERIODO\s+(\d{6})/;
  const CODCURSO = /^[A-Z]{3,5}-\d+$/;

  const ent = x => { const n = Math.trunc(Number(x)); return isNaN(n) ? 0 : n; };
  const vacio = x => x === null || x === undefined;
  const txt = x => (vacio(x) ? '' : String(x));

  /* Hoja "principal" del archivo de UN programa → nombres de curso y periodo */
  function leerPrincipal(rows, nombres, periodos) {
    for (const r of rows) {
      const m = PERIODO.exec(txt(r[0]));
      if (m) periodos.add(m[1]);
      if (r[0] && CODCURSO.test(String(r[0]).trim())) nombres[String(r[0]).trim()] = txt(r[1]).trim();
    }
  }

  /* Hoja de un curso → secciones con sus bloques horarios */
  function leerCurso(rows, nombres) {
    let cod = null, mod = '', cur = null, cols = {};
    const secs = [];
    for (const r of rows) {
      const a = r[0];
      if (typeof a === 'string' && HDR.test(a) && cod === null && a.includes('(') && a.includes('-') && !a.toUpperCase().includes('PRESENCIAL')) {
        cod = HDR.exec(a)[2]; continue;
      }
      if (typeof a === 'string' && a.toUpperCase().includes('PRESENCIAL') && cod && !secs.length && cur === null) { mod = a.trim(); continue; }
      if (a === 'NRC:') {
        cols = {};
        r.forEach((v, i) => { if (v) cols[String(v).replace(/:+$/, '').trim()] = i; });
        cur = 'esperando'; continue;
      }
      if (cur === 'esperando' && typeof a === 'number') {
        const g = (n, d = 0) => (n in cols && !vacio(r[cols[n]]) ? r[cols[n]] : d);
        cur = { nrc: ent(a), sec: String(g('SECC', '')), idl: g('ID LIGA', null), l: g('LIGA', null), cr: ent(g('CRED')), h: ent(g('H')),
          ht: ent(g('HT')), pp: ent(g('PP')), cap: ent(g('CAPA')), reg: ent(g('REGI')), blq: String(g('BLOQUE', 'NO')), mod, m: [] };
        secs.push(cur); continue;
      }
      if (a === 'PABE') continue;
      if (cur && typeof cur === 'object') {
        if (!(r[2] && String(r[2]).trim().endsWith(','))) continue;      // fila que no es un bloque horario
        const [pab, aula, dia, hora, idd0, doc] = r;
        if (!pab || !aula) continue;                                      // clases no presenciales (sin pabellón/aula): no se cargan
        let idd = idd0;
        if (typeof idd0 === 'number') idd = Math.trunc(idd0);
        else if (typeof idd0 === 'string' && /^\s*[+-]?\d+\s*$/.test(idd0)) idd = parseInt(idd0, 10);   // "STAFF" se conserva como texto
        cur.m.push([String(pab), String(aula), String(dia).replace(/^[ ,]+|[ ,]+$/g, '').slice(0, 3).toUpperCase(), txt(hora).trim(), vacio(idd) ? '' : idd, txt(doc).trim()]);
      }
    }
    return cod && secs.length ? { c: cod, n: nombres[cod] || '', s: secs } : null;
  }

  /* hojas = [{name, rows}] de un archivo .xlsm → { cursos, periodos, faltan } */
  function leerPrograma(hojas) {
    const nombres = {}, periodos = new Set(), cursos = [];
    for (const h of hojas) if (h.name.toLowerCase() === 'principal') leerPrincipal(h.rows, nombres, periodos);
    for (const h of hojas) {
      if (h.name.toLowerCase() === 'principal') continue;
      const c = leerCurso(h.rows, nombres);
      if (c) cursos.push(c);
    }
    const orden = Object.keys(nombres).reduce((o, c, i) => (o[c] = i, o), {});
    cursos.sort((x, y) => (orden[x.c] ?? 1e6) - (orden[y.c] ?? 1e6));
    const hechos = new Set(cursos.map(c => c.c));
    return { cursos, periodos, faltan: Object.keys(nombres).filter(c => !hechos.has(c)) };
  }

  /* principal.xlsm (listado de programas) → { ACRONIMO: nombre } en orden */
  function leerListado(rows) {
    const out = {};
    for (const r of rows) {
      const v = r.filter(x => x);
      if (v.length >= 2 && /^[A-Z]{4}$/.test(String(v[v.length - 2]))) out[String(v[v.length - 2])] = String(v[v.length - 1]);
    }
    return out;
  }

  /* Convierte programas → filas planas (una por bloque horario; una vacía de aula por sección sin bloques) */
  function aplanar(programas, periodo) {
    const filas = [];
    for (const p of programas) for (const c of p.cursos) for (const s of c.s) {
      const base = [periodo, p.k, p.n, c.c, c.n, s.nrc, s.sec, txt(s.idl), txt(s.l), s.cr, s.h, s.ht, s.pp, s.cap, s.reg, s.blq, s.mod];
      if (!s.m.length) filas.push([...base, '', '', '', '', '', '']);
      else for (const m of s.m) filas.push([...base, ...m]);
    }
    return filas;
  }

  function aCSV(filas, sep) {
    sep = sep || ',';
    const q = v => { v = txt(v); return /[",;\t\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [COLUMNAS, ...filas].map(f => f.map(q).join(sep)).join('\n');
  }
  const aTSV = filas => [COLUMNAS, ...filas].map(f => f.map(v => txt(v).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');

  const api = { COLUMNAS, leerPrograma, leerListado, aplanar, aCSV, aTSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.ImportadorNucleo = api;
})(typeof window !== 'undefined' ? window : globalThis);
