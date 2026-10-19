/* importador.js · lee los .xlsm (o el CURSOS_2026.zip) en el navegador y genera la hoja plana "Horarios".
   Sin Python: usa SheetJS (XLSX) y JSZip desde cdnjs, y importador-nucleo.js para interpretar las hojas. */
(function () {
  const N = window.ImportadorNucleo, $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let CSV = '', TSV = '';

  const base = n => n.split(/[\\/]/).pop();
  const clave = n => base(n).replace(/\.(xlsm|xlsx)$/i, '').toUpperCase();
  const estado = t => { $('#est').textContent = t; };

  function hojasDe(buf) {
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    return wb.SheetNames.map(name => ({ name, rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null, raw: true, blankrows: true }) }));
  }

  /* Reúne los archivos: .xlsm sueltos y/o dentro de uno o varios .zip → [{nombre, buf}] */
  async function reunir(lista) {
    const out = [];
    for (const f of lista) {
      if (/\.zip$/i.test(f.name)) {
        const z = await JSZip.loadAsync(await f.arrayBuffer());
        for (const e of Object.values(z.files)) {
          if (e.dir || /(^|\/)(__MACOSX|~\$)/.test(e.name) || !/\.(xlsm|xlsx)$/i.test(e.name)) continue;
          out.push({ nombre: base(e.name), buf: await e.async('arraybuffer') });
        }
      } else if (/\.(xlsm|xlsx)$/i.test(f.name)) out.push({ nombre: f.name, buf: await f.arrayBuffer() });
    }
    return out;
  }

  async function procesar(lista) {
    if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') { estado('No se cargaron las librerías (sin internet). Conéctate y recarga la página.'); return; }
    $('#res').hidden = true;
    estado('Leyendo archivos…');
    const archivos = await reunir(lista);
    if (!archivos.length) { estado('No encontré archivos .xlsm en lo que subiste.'); return; }
    const avisos = [], progs = [], periodos = new Set();
    let nombres = {};
    const pr = archivos.find(a => clave(a.nombre) === 'PRINCIPAL');
    if (pr) nombres = N.leerListado(hojasDe(pr.buf)[0].rows);
    else avisos.push('No subiste principal.xlsm: los programas saldrán con su código como nombre y sin el orden oficial.');
    const orden = Object.keys(nombres), resto = archivos.filter(a => clave(a.nombre) !== 'PRINCIPAL');
    resto.sort((a, b) => { const i = orden.indexOf(clave(a.nombre)), j = orden.indexOf(clave(b.nombre)); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j) || clave(a.nombre).localeCompare(clave(b.nombre)); });
    let n = 0;
    for (const a of resto) {
      estado('Procesando ' + (++n) + ' de ' + resto.length + ': ' + a.nombre);
      await new Promise(r => setTimeout(r, 0));          // deja respirar a la página
      const k = clave(a.nombre), r = N.leerPrograma(hojasDe(a.buf));
      r.periodos.forEach(p => periodos.add(p));
      progs.push({ k, n: nombres[k] || k, cursos: r.cursos });
      if (r.faltan.length) avisos.push(k + ': ' + r.faltan.length + ' curso(s) figuran en la lista del programa pero no tienen hoja con secciones (ej. ' + r.faltan.slice(0, 4).join(', ') + '). Falta descargarlos en el archivo de origen.');
    }
    if (orden.length) { const sin = orden.filter(k => !progs.some(p => p.k === k)); if (sin.length) avisos.push('Programas de principal.xlsm sin archivo: ' + sin.join(', ')); }
    if (periodos.size > 1) avisos.push('Los archivos son de periodos distintos: ' + [...periodos].sort().join(', ') + '. Se usa el más reciente.');
    const periodo = [...periodos].sort().pop() || '';
    const filas = N.aplanar(progs, periodo);
    CSV = '\uFEFF' + N.aCSV(filas); TSV = N.aTSV(filas);
    mostrar(progs, filas, periodo, avisos);
    estado('Listo: ' + progs.length + ' programas procesados.');
  }

  function mostrar(progs, filas, periodo, avisos) {
    const secs = progs.reduce((t, p) => t + p.cursos.reduce((u, c) => u + c.s.length, 0), 0);
    $('#resumen').innerHTML = '<div class="kpis"><div class="kpi"><b>' + esc(periodo || '—') + '</b>periodo</div><div class="kpi"><b>' + progs.length + '</b>programas</div><div class="kpi"><b>' + secs + '</b>secciones (NRC)</div><div class="kpi"><b>' + filas.length + '</b>filas</div></div>' +
      '<p class="mut">' + progs.map(p => esc(p.k) + ' ' + p.cursos.length).join(' · ') + '</p>';
    $('#avisos').innerHTML = avisos.map(a => '<div class="warn">⚠ ' + esc(a) + '</div>').join('');
    $('#prev').innerHTML = '<thead><tr>' + N.COLUMNAS.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' +
      filas.slice(0, 15).map(f => '<tr>' + f.map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('') + '</tbody>';
    $('#res').hidden = false;
  }

  $('#fi').onchange = e => procesar([...e.target.files]).catch(err => { estado('Error: ' + (err.message || err)); console.error(err); });
  const dz = $('#drop');
  ['dragenter', 'dragover'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.add('on'); }));
  ['dragleave', 'drop'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.remove('on'); }));
  dz.addEventListener('drop', e => procesar([...e.dataTransfer.files]).catch(err => { estado('Error: ' + (err.message || err)); console.error(err); }));

  $('#bcsv').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([CSV], { type: 'text/csv;charset=utf-8' }));
    a.download = 'horarios.csv'; document.body.appendChild(a); a.click(); a.remove();
  };
  $('#bcopy').onclick = async () => {
    try { await navigator.clipboard.writeText(TSV); }
    catch (_) { const t = document.createElement('textarea'); t.value = TSV; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    estado('Copiado. Pégalo en la celda A1 de la hoja "Horarios" de Google Sheets.');
  };
})();
