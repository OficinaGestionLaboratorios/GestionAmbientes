/* Horarios de laboratorios · lógica de la página. Los datos (A, MAT, CAR, PERIODO) los arma datos.js */
const DN=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const car=sec=>CAR[String(sec)[0]]||null;
/* alumnos registrados (REGI) por NRC, de los archivos de programas */
const alu=set=>Object.keys(MAT).length?[...set].reduce((a,n)=>a+(+MAT[n]||0),0):null;
function inf(l){const g={};l.ev.forEach(e=>{const c=e[7][0];(g[c]=g[c]||{n:new Set(),d:new Set()});g[c].n.add(e[4]);e[8].forEach(x=>g[c].d.add(x))});
 const n=new Set(l.ev.map(e=>e[4])),d=new Set(l.ev.flatMap(e=>e[8])),cs=Object.keys(g).filter(c=>CAR[c]);
 return{g,n,d,cs,k:Object.keys(g).filter(c=>!CAR[c]),p:new Set(l.ev.flatMap(e=>e[9]))}}
const pg=S=>[...S].map(x=>x.toLowerCase()).sort().join(', ');
function informe(id){const l=A.labs.find(x=>x.id===id),r=inf(l),f=v=>v===null?'—':v;
 $('#pb').classList.add('w');$('#pb').style.setProperty('--k','var(--pri)');
 $('#pb').innerHTML=`<button class="x" onclick="$('#pn').classList.remove('on')">✕</button><h3>Informe · ${esc(l.n)} · ${esc(l.amb)}</h3><p>${esc(l.p)} · ${esc(l.s)} · Periodo ${esc(PERIODO)}</p>
 <table class="tb"><thead><tr><th>Carrera</th><th>NRC</th><th>Docentes</th><th>Alumnos</th></tr></thead><tbody>${r.cs.sort((a,b)=>CAR[a][1].localeCompare(CAR[b][1])).map(c=>`<tr><td>${esc(CAR[c][1])} <small style="color:var(--mut)">${CAR[c][0]}</small></td><td>${r.g[c].n.size}</td><td>${r.g[c].d.size}</td><td>${f(alu(r.g[c].n))}</td></tr>`).join('')}</tbody>
 <tfoot><tr><td>Total (sin duplicar)</td><td>${r.n.size}</td><td>${r.d.size}</td><td>${f(alu(r.n))}</td></tr></tfoot></table>
 <p>Programas: <b>${pg(r.p)||'—'}</b> (${r.p.size})</p><p>Carreras que estudian aquí: <b>${r.cs.length}</b>${r.k.length?' · secciones con código sin carrera en la lista: <b>'+r.k.join(', ')+'</b>':''}</p>${Object.keys(MAT).length?'':'<p>Alumnos: sin datos de matrícula cargados.</p>'}<button class="ex" onclick="expLab(${l.id})">⬇ Exportar este informe (Excel)</button>`;
 $('#pn').classList.add('on')}
function crc32(b){let t=crc32.t;if(!t){t=crc32.t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}let r=-1;for(let i=0;i<b.length;i++)r=t[(r^b[i])&255]^(r>>>8);return(r^-1)>>>0}
function zip(files){const E=new TextEncoder(),u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255],parts=[],cd=[];let off=0;
 files.forEach(([n,d])=>{const nb=E.encode(n),db=E.encode(d),c=crc32(db),f=[...u16(0x0800),...u16(0),...u16(0),...u16(33),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)];
  parts.push(new Uint8Array([0x50,0x4b,3,4,20,0,...f]),nb,db);
  cd.push(new Uint8Array([0x50,0x4b,1,2,20,0,20,0,0,8,0,0,0,0,...u16(33),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
  off+=30+nb.length+db.length});
 const cs=cd.reduce((a,x)=>a+x.length,0);
 return new Blob([...parts,...cd,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
const colL=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=((i-m-1)/26)|0}return s},xe=v=>String(v).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function sheetXml(S){const R=S.rows,nc=R[0].length,last=colL(nc-1),nf=S.total?R.length-1:R.length;
 const rows=R.map((r,i)=>{const st=i===0?1:(S.total&&i===R.length-1?2:0);return`<row r="${i+1}">`+r.map((v,j)=>{const ref=colL(j)+(i+1);return typeof v==='number'?`<c r="${ref}" s="${st}"><v>${v}</v></c>`:(v===''||v==null?(st?`<c r="${ref}" s="${st}"/>`:''):`<c r="${ref}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${xe(v)}</t></is></c>`)}).join('')+'</row>'}).join('');
 return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${S.w.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${last}${nf}"/></worksheet>`}
function xlsx(name,sheets){const N='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const files=[['[Content_Types].xml',H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'],
 ['_rels/.rels',H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
 ['xl/workbook.xml',H+`<workbook ${N} xmlns:r="${RT}"><sheets>${sheets.map((s,i)=>`<sheet name="${xe(s.n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
 ['xl/_rels/workbook.xml.rels',H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${RT}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${RT}/styles" Target="styles.xml"/></Relationships>`],
 ['xl/styles.xml',H+`<styleSheet ${N}><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0A6ED1"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEBF5FE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`],
 ...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)])];
 const a=document.createElement('a');a.href=URL.createObjectURL(zip(files));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const nm=c=>CAR[c]?CAR[c][1]:'Sección '+c+' (sin carrera en la lista)',v0=v=>v===null?'':v;
function carRows(l){const r=inf(l);return[...r.cs.sort((x,y)=>CAR[x][1].localeCompare(CAR[y][1])),...r.k].map(c=>[c,r.g[c].n,r.g[c].d])}
function labsBook(all){const L=all?A.labs:vis(),n=new Set(),d=new Set(),T={};
 const P=new Set(),R1=[['Laboratorio','Total Registrado','N° Profesores','Total NRC','Programas','Cantidad PE','Sede','Programa académico']],
       R2=[['Programa','Laboratorio','Ambiente','Sede','Carrera','Abreviatura','NRC programados','Docentes (únicos)','Alumnos registrados']];
 L.forEach(l=>{const r=inf(l);r.n.forEach(x=>n.add(x));r.d.forEach(x=>d.add(x));r.p.forEach(x=>P.add(x));
  R1.push([l.n+' · '+l.amb,v0(alu(r.n)),r.d.size,r.n.size,pg(r.p)||'—',r.p.size,l.s,l.p]);
  carRows(l).forEach(([c,cn,cd])=>{R2.push([l.p,l.n,l.amb,l.s,nm(c),CAR[c]?CAR[c][0]:c,cn.size,cd.size,v0(alu(cn))]);const t=T[c]=T[c]||{l:new Set(),n:new Set(),d:new Set()};t.l.add(l.id);cn.forEach(x=>t.n.add(x));cd.forEach(x=>t.d.add(x))})});
 R1.push(['TOTAL (sin duplicar) · '+L.length+' laboratorios',v0(alu(n)),d.size,n.size,pg(P),P.size,'','']);
 const R3=[['Carrera','Abreviatura','Laboratorios donde se programa','NRC programados','Docentes (únicos)','Alumnos registrados']];
 Object.keys(T).sort((x,y)=>nm(x).localeCompare(nm(y))).forEach(c=>R3.push([nm(c),CAR[c]?CAR[c][0]:c,T[c].l.size,T[c].n.size,T[c].d.size,v0(alu(T[c].n))]));
 return{file:'Informe_laboratorios_'+(all?'todos':'filtrados')+'_'+PERIODO+'.xlsx',sheets:[{n:'Resumen por laboratorio',rows:R1,w:[48,16,14,12,80,12,12,30],total:true},{n:'Carreras por laboratorio',rows:R2,w:[26,42,12,12,38,12,12,12,12]},{n:'Total por carrera',rows:R3,w:[38,12,16,12,12,12]}]}}
function expLabs(all){const b=labsBook(all);xlsx(b.file,b.sheets)}
function expLab(id){const l=A.labs.find(x=>x.id===id),r=inf(l);
 const R=[['Laboratorio','Ambiente','Carrera','Abreviatura','NRC programados','Docentes (únicos)','Alumnos registrados']];
 carRows(l).forEach(([c,cn,cd])=>R.push([l.n,l.amb,nm(c),CAR[c]?CAR[c][0]:c,cn.size,cd.size,v0(alu(cn))]));
 R.push([l.n,l.amb,'TOTAL (sin duplicar)','',r.n.size,r.d.size,v0(alu(r.n))]);
 xlsx('Informe_'+l.amb.replace(/[^\w-]+/g,'_')+'_'+PERIODO+'.xlsx',[{n:'Informe',rows:R,w:[42,12,38,12,12,12,12],total:true}])}
let PV=null,PT=0,PQ='';
function previa(all){PV=labsBook(all);PT=0;PQ='';$('#pv').classList.add('on');pvr()}
function pvr(){const b=PV,sh=b.sheets[PT],R=sh.rows,tot=!!sh.total,q=norm(PQ),n=R.length-1-(tot?1:0);
 const body=R.slice(1).map((r,i)=>({r,t:tot&&i===R.length-2})).filter(x=>x.t||!q||norm(x.r.join(' ')).includes(q));
 $('#pv').innerHTML=`<div class="pvh"><h2>Vista previa · ${esc(b.file)}</h2><button class="dl" onclick="xlsx(PV.file,PV.sheets)">⬇ Descargar Excel</button><button onclick="$('#pv').classList.remove('on')">✕ Cerrar</button></div><div class="pvt">${b.sheets.map((x,i)=>`<button class="tab${i===PT?' on':''}" data-t="${i}">${esc(x.n)} (${x.rows.length-1-(x.total?1:0)})</button>`).join('')}<input type="search" id="pq" placeholder="Filtrar esta hoja…" value="${esc(PQ)}"></div><div class="pvb"><table class="pt"><thead><tr>${R[0].map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body.map(x=>`<tr${x.t?' class="tot"':''}>${x.r.map(v=>typeof v==='number'?`<td class="num">${v.toLocaleString('es-PE')}</td>`:`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${R[0].length}">Sin resultados</td></tr>`}</tbody></table></div>`;
 document.querySelectorAll('#pv .tab').forEach(t=>t.onclick=()=>{PT=+t.dataset.t;PQ='';pvr()});
 const i=$('#pq');i.oninput=e=>{PQ=e.target.value;const c=e.target.selectionStart;pvr();const m=$('#pq');m.focus();m.setSelectionRange(c,c)}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#pv').classList.remove('on')});
const PAL=['#0a6ed1','#e9730c','#16a34a','#9333ea','#dc2626','#0891b2','#ca8a04','#db2777'],PX=0.95;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hs=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))>>>0;return x},col=c=>PAL[hs(c)%PAL.length];
const f2=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const nowT=()=>{const d=new Date();return{di:(d.getDay()+6)%7,m:d.getHours()*60+d.getMinutes()}};
let S={p:'ALL',l:+(location.hash.slice(1))||null,q:'',lq:'',c:null,r:null,d:Math.min(nowT().di,5),fo:false};
$('#th').onclick=()=>{const r=document.documentElement,d=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=d?'light':'dark'};
$('#lq').oninput=e=>{S.lq=e.target.value;list()};
const stat=l=>{if(!l.ev.length)return null;const t=nowT();return l.ev.find(e=>e[0]===t.di&&e[1]<=t.m&&t.m<e[2])||false};
const hrs=l=>{const s=new Set();return Math.round(l.ev.reduce((a,e)=>a+(e[2]-e[1]),0)/60)};
function progs(){const n={};A.labs.forEach(l=>n[l.a]=(n[l.a]||0)+1);
 $('#pr').innerHTML=`<button class="pc${S.p==='ALL'?' on':''}" data-p="ALL"><b>Todos</b><small>${A.labs.length}</small></button>`+A.progs.map(p=>`<button class="pc${S.p===p.k?' on':''}" data-p="${p.k}" title="${esc(p.n)}"><b>${p.k}</b><small>${n[p.k]}</small></button>`).join('');
 document.querySelectorAll('.pc').forEach(b=>b.onclick=()=>{S.p=b.dataset.p;progs();list()})}
function vis(){return A.labs.filter(l=>(S.p==='ALL'||l.a===S.p)&&(!S.lq||norm(l.n+' '+l.amb+' '+l.p).includes(norm(S.lq))))}
function list(){const L=vis();$('#ef').textContent='👁 Informe: filtrados ('+L.length+')';if(!L.find(l=>l.id===S.l)&&L.length&&!S.l)S.l=(L.find(l=>l.ev.length)||L[0]).id;
 $('#ll').innerHTML=L.map(l=>{const p=Math.min(100,Math.round(hrs(l)/72*100));
  return`<button class="lb${l.id===S.l?' on':''}" data-l="${l.id}"><b><span style="color:var(--ink)">${esc(l.n)}</span><em>${esc(l.amb)}</em></b><span>${l.ev.length?'':'Sin clases registradas · '}${l.a}${l.s!=='Campus I'?' · '+esc(l.s):''}</span><i><u style="width:${p}%"></u></i></button>`}).join('')||'<div class="emp">Sin resultados</div>';
 document.querySelectorAll('.lb').forEach(b=>b.onclick=()=>{S.l=+b.dataset.l;S.c=null;S.r=null;S.q='';list();main();scrollTo({top:0})});
 main()}
function lanes(L){L.sort((x,y)=>x[1]-y[1]||x[2]-y[2]);let g=[],end=-1;L.forEach(e=>{if(e[1]>=end)g.push([]);g[g.length-1].push(e);end=Math.max(end,e[2])});
 g.forEach(G=>{const ln=[];G.forEach(e=>{let k=ln.findIndex(x=>x<=e[1]);if(k<0){k=ln.length;ln.push(0)}ln[k]=e[2];e.k=k});G.forEach(e=>e.n=ln.length)})}
function main(){const l=A.labs.find(x=>x.id===S.l),M=$('#mn');if(!l){M.innerHTML='<div class="emp">Selecciona un laboratorio</div>';return}
 history.replaceState(null,'','#'+l.id);
 let E=l.ev.filter(e=>!S.r||e[3]===S.r);const rooms=[...new Set(l.ev.map(e=>e[3]))].sort(),cs=[...new Set(l.ev.map(e=>e[5]))].sort();
 const t=nowT(),R=inf(l),al=alu(R.n);
 let h=`<h2>${esc(l.n)} · ${esc(l.amb)}</h2><p class="sub">${esc(l.p)} · ${esc(l.s)}</p><div class="kp"><div class="k"><b>${R.n.size}</b><span>NRC programados</span></div><div class="k"><b>${R.d.size}</b><span>docentes (únicos)</span></div><div class="k"><b>${al===null?'—':al}</b><span>alumnos registrados</span></div><div class="k"><b>${R.cs.length}</b><span>carreras</span></div><div class="k"><b>${hrs(l)}</b><span>horas/semana</span></div><button class="inf" onclick="informe(${l.id})">Ver informe</button></div>`;
 if(!l.ev.length){M.innerHTML=h+'<div class="emp">'+(l.rooms.length?'No hay clases registradas en este ambiente en los archivos del periodo.':'Este laboratorio figura en la matriz como «'+esc(l.amb)+'», sin un aula específica; no se puede cruzar con los horarios.')+'</div>';return}
 h+=`<div class="tools"><input type="search" id="q" placeholder="Buscar curso, sección, NRC o docente…" value="${esc(S.q)}">`+(rooms.length>1?`<button class="tab${!S.r?' on':''}" data-r="">Todos</button>`+rooms.map(r=>`<button class="tab${S.r===r?' on':''}" data-r="${r}">${r}</button>`).join(''):'')+'</div>';
 h+='<div class="leg">'+cs.map(c=>`<button class="lg${S.c===c?' on':''}" style="--k:${col(c)}" data-c="${c}">${c}</button>`).join('')+'</div>';
 const dmax=Math.max(4,...E.map(e=>e[0])),mob=matchMedia('(max-width:900px)').matches,dl=mob?[Math.min(S.d,dmax)]:Array.from({length:dmax+1},(_,i)=>i);
 h+='<div class="days">'+DN.slice(0,dmax+1).map((n,i)=>`<button class="${S.d===i?'on':''}" data-d="${i}">${n.slice(0,3)}</button>`).join('')+'</div>';
 const t0=Math.floor((Math.min(...E.map(e=>e[1]))-20)/60)*60,t1=Math.ceil((Math.max(...E.map(e=>e[2]))+20)/60)*60,H=(t1-t0)*PX,hrsL=[];for(let m=t0;m<=t1;m+=60)hrsL.push(m);
 h+=`<div class="cal" style="grid-template-columns:54px repeat(${dl.length},minmax(140px,1fr))"><div class="hd">Hora</div>`+dl.map(i=>`<div class="hd${i===t.di?' td':''}">${DN[i]}${i===t.di?'<small>hoy</small>':''}</div>`).join('')+
 `<div class="tm" style="height:${H}px">${hrsL.map(m=>`<span style="top:${(m-t0)*PX}px">${f2(m)}</span>`).join('')}</div>`;
 const q=norm(S.q);let shown=0;
 dl.forEach(di=>{const L=E.filter(e=>e[0]===di).map(e=>e.slice());lanes(L);
  h+=`<div class="col${di===t.di?' td':''}" data-d="${di}" style="height:${H}px">`+hrsL.map(m=>`<div class="ln" style="top:${(m-t0)*PX}px"></div>`).join('')+
  L.map(e=>{const ok=(!q||norm(e[6]+' '+e[5]+' '+e[4]+' '+e[7]+' '+e[8].join(' ')).includes(q))&&(!S.c||S.c===e[5]);if(ok)shown++;const w=100/e.n,id=l.ev.findIndex(x=>x[0]===e[0]&&x[1]===e[1]&&x[4]===e[4]&&x[3]===e[3]);
   return`<div class="ev${ok?'':' dim'}" data-i="${id}" style="--k:${col(e[5])};top:${(e[1]-t0)*PX+1}px;height:${(e[2]-e[1])*PX-2}px;left:calc(${e.k*w}% + 2px);width:calc(${w}% - 4px)"><b>${esc(e[6])}</b><span class="hr">${f2(e[1])} – ${f2(e[2])}</span><span>${car(e[7])?car(e[7])[0]+' · ':''}${esc(e[7])}${rooms.length>1?' · '+e[3]:''}</span></div>`}).join('')+'</div>'});
 M.innerHTML=h+'</div>';
 const qi=$('#q');qi.oninput=e=>{S.q=e.target.value;const p=e.target.selectionStart;main();const n=$('#q');n.focus();n.setSelectionRange(p,p)};
 M.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{S.r=b.dataset.r||null;main()});
 M.querySelectorAll('.lg').forEach(b=>b.onclick=()=>{S.c=S.c===b.dataset.c?null:b.dataset.c;main()});
 M.querySelectorAll('.days button').forEach(b=>b.onclick=()=>{S.d=+b.dataset.d;main()});
 M.querySelectorAll('.ev').forEach(el=>el.onclick=()=>detail(l.ev[+el.dataset.i]));
 }
function detail(e){$('#pb').classList.remove('w');$('#pb').style.setProperty('--k',col(e[5]));
 $('#pb').innerHTML=`<button class="x" onclick="$('#pn').classList.remove('on')">✕</button><h3>${esc(e[6])}</h3><p><b>${e[5]}</b> · Sección ${esc(e[7])} · NRC ${e[4]}</p><p>Carrera: <b>${car(e[7])?car(e[7])[1]:'—'}</b></p><p><b>${DN[e[0]]}</b> · ${f2(e[1])} – ${f2(e[2])} · Ambiente ${esc(e[3])}</p><p>Programa${e[9].length>1?'s':''}: <b>${e[9].join(', ')}</b></p><p>Docente${e[8].length>1?'s':''}: <b>${e[8].map(esc).join('; ')||'—'}</b></p>`;$('#pn').classList.add('on')}
$('#pn').onclick=e=>{if(e.target.id==='pn')e.currentTarget.classList.remove('on')};
matchMedia('(max-width:900px)').onchange=main;
progs();list();
