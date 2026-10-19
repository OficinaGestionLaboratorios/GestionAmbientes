/* Explorador de horarios · lógica de la página. Los datos (D, PERIODO) los arma datos.js */
const DAYS={LUN:'LUN',MAR:'MAR',MIE:'MIÉ',JUE:'JUE',VIE:'VIE',SAB:'SÁB',DOM:'DOM'};
const $=s=>document.querySelector(s),app=$('#app'),cr=$('#cr');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let ppSel=0,q='';
$('#th').onclick=()=>{const r=document.documentElement,d=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=d?'light':'dark'};
function go(h){location.hash=h}
function crumbs(p,c){let h='<a onclick="go(\'#/\')">Programas</a>';
 if(p)h+=' <span>›</span> '+(c?`<a onclick="go('#/${p.k}')">${esc(p.k)}</a>`:`<b>${esc(p.n)}</b>`);
 if(c)h+=' <span>›</span> <b>'+esc(c.c)+'</b>';cr.innerHTML=h}
/* Búsqueda global: cursos por código o nombre (todas las palabras) y secciones por NRC */
function buscarCursos(txt){
 const w=norm(txt).split(/\s+/).filter(Boolean),dig=/^\d{2,}$/.test(txt.trim())?txt.trim():'',out=[];
 if(!w.length)return out;
 D.forEach(p=>p.c.forEach(c=>{
  const h=norm(c.c+' '+c.n),porNombre=w.every(x=>h.includes(x)),nrcs=dig?c.s.filter(s=>String(s.nrc).includes(dig)):[];
  if(porNombre||nrcs.length)out.push({p,c,nrcs})}));
 return out}
function viewPrograms(){crumbs();
 const l=D.filter(p=>norm(p.k+' '+p.n).includes(norm(q))),r=buscarCursos(q),MAX=100;
 let h=`<div class="bar"><input type="search" id="q" placeholder="Buscar programa, curso, código o NRC…" value="${esc(q)}"><span class="cnt">${l.length} programas${q.trim()?' · '+r.length+' cursos':''}</span><button class="lnk" onclick="go('#/docentes')">🔍 Buscar docente</button></div>`;
 if(l.length||!q.trim())h+='<div class="grid">'+l.map(p=>`<div class="pc" onclick="q='';go('#/${p.k}')"><span class="code">${p.k}</span><h3>${esc(p.n)}</h3><span class="big">${p.c.length}</span><p>cursos</p></div>`).join('')+'</div>';
 if(q.trim()&&r.length){
  h+=`<h3 style="margin:20px 0 8px">Cursos y NRC que coinciden${r.length>MAX?' (primeros '+MAX+' de '+r.length+')':''}</h3><div class="list"><div class="lh"><span>Código</span><span>Curso</span></div>`+
   r.slice(0,MAX).map(({p,c,nrcs})=>`<div class="row" onclick="q='';ppSel=0;go('#/${p.k}/${c.c}')"><span class="code">${c.c}</span><span class="n">${esc(c.n)}${nrcs.length?` <em style="color:var(--mut);font-style:normal;font-size:12px">· NRC ${nrcs.slice(0,4).map(x=>x.nrc+' (secc. '+esc(x.sec)+')').join(', ')}${nrcs.length>4?' …':''}</em>`:''}</span><span class="s">${p.k}</span></div>`).join('')+'</div>'}
 if(!l.length&&!r.length)h+='<div class="empty">Sin resultados</div>';
 app.innerHTML=h;bind()}
function viewCourses(p){crumbs(p);
 const l=p.c.filter(c=>norm(c.c+' '+c.n).includes(norm(q)));
 app.innerHTML=`<h2>${esc(p.n)}</h2><p class="sub">Selecciona un curso para ver sus secciones y horarios.</p><div class="bar"><input type="search" id="q" placeholder="Buscar curso o código…" value="${esc(q)}"><span class="cnt">${l.length} cursos</span></div><div class="list"><div class="lh"><span>Código</span><span>Curso</span></div>`+
 l.map(c=>`<div class="row" onclick="q='';ppSel=0;go('#/${p.k}/${c.c}')"><span class="code">${c.c}</span><span class="n">${esc(c.n)}</span><span class="s">${c.s.length} secc.</span></div>`).join('')+'</div>'+(l.length?'':'<div class="empty">Sin resultados</div>');
 bind()}
function viewDetail(p,c){crumbs(p,c);
 const pps=[...new Set(c.s.map(s=>s.pp))].sort();
 const l=c.s.filter(s=>!ppSel||s.pp===ppSel);
 let h=`<h2>${esc(c.n)}</h2><p class="sub">${esc(c.c)} · ${c.s.length} secciones</p>`;
 if(pps.length>1)h+='<div class="tabs"><button class="tab'+(!ppSel?' on':'')+'" data-pp="0">Todas</button>'+pps.map(x=>`<button class="tab${ppSel===x?' on':''}" data-pp="${x}">Parte ${x}</button>`).join('')+'</div>';
 h+=l.map(s=>{const pc=s.cap?Math.min(100,Math.round(s.reg/s.cap*100)):0;
  return `<div class="sec"><div class="sh"><b>NRC ${s.nrc}</b><span>Secc. <b style="font-size:13px">${esc(s.sec)}</b></span>
  <span class="tag ${s.cr>0?'t':'p'}">${s.cr>0?'Teoría':'Práctica'}</span><em>Liga ${esc(s.idl)}→${esc(s.l)}</em><em>${s.cr} cred · ${s.h}h</em><em>PP ${s.pp}</em>${s.blq==='SI'?'<span class="tag">Bloque</span>':''}${s.mod?`<em>${s.mod.startsWith('NO')?'No presencial':'Presencial'}</em>`:''}
  <div class="cap${pc>=100?' full':''}">${s.reg} / ${s.cap} matriculados<i><u style="width:${pc}%"></u></i></div></div>`+
  s.m.map(m=>`<div class="mt"><span class="day">${DAYS[m[2]]||esc(m[2])}</span><span class="hr">${esc(m[3])}</span><span class="au">${esc(m[0])} · Aula ${esc(m[1])}</span><span class="dc"><a href="#/docentes/${esc(m[4])}" title="Ver horario del docente">${esc(m[5])}</a></span></div>`).join('')+'</div>'}).join('');
 if(!l.length)h+='<div class="empty">No hay secciones registradas para este curso.</div>';
 app.innerHTML=h;app.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ppSel=+b.dataset.pp;viewDetail(p,c)})}

/* ===== Buscador de docentes ===== */
const T=(()=>{const m=new Map();
 D.forEach(p=>p.c.forEach(c=>c.s.forEach(s=>s.m.forEach(x=>{const id=String(x[4]);
  let t=m.get(id);if(!t){t={id,n:x[5],nn:norm(x[5]),items:[]};m.set(id,t)}
  t.items.push({p,c,s,m:x})}))));
 m.forEach(t=>{t.nrcs=new Set(t.items.map(i=>i.s.nrc)).size;t.courses=new Set(t.items.map(i=>i.p.k+i.c.c)).size;
  t.progs=[...new Set(t.items.map(i=>i.p.k))].sort()});
 return m})();
const TL=[...T.values()].sort((a,b)=>a.n.localeCompare(b.n,'es'));
const tmin=s=>{const r=/(\d+):(\d+)\s*(AM|PM)/i.exec(s||'');if(!r)return null;let h=+r[1]%12;if(r[3].toUpperCase()==='PM')h+=12;return h*60+ +r[2]};
const trange=s=>{const [a,b]=String(s).split('-');return [tmin(a),tmin(b)]};
const ORD=['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];
let tq='';
function hl(text,words){let o=esc(text);if(!words.length)return o;
 const nt=norm(text);if(nt.length!==text.length)return o; // seguridad: solo resaltar si la normalización conserva longitud
 const rg=[];words.forEach(w=>{let i=0;while((i=nt.indexOf(w,i))>-1){rg.push([i,i+w.length]);i+=w.length}});
 if(!rg.length)return o;rg.sort((a,b)=>a[0]-b[0]);const mg=[];rg.forEach(r=>{const l=mg[mg.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else mg.push(r.slice())});
 let out='',p=0;mg.forEach(([a,b])=>{out+=esc(text.slice(p,a))+'<mark>'+esc(text.slice(a,b))+'</mark>';p=b});return out+esc(text.slice(p))}
function crumbsT(t){cr.innerHTML='<a onclick="go(\'#/\')">Programas</a> <span>›</span> '+(t?`<a onclick="go('#/docentes')">Docentes</a> <span>›</span> <b>${esc(t.n)}</b>`:'<b>Docentes</b>')}
function viewTeachers(){crumbsT();
 app.innerHTML=`<h2>Buscador de docentes</h2><p class="sub">Busca por apellidos, nombres o código. Puedes escribir las palabras en cualquier orden.</p>
 <div class="bar"><input type="search" id="tq" placeholder="Ej.: castañeda nassi, 417…" value="${esc(tq)}" autocomplete="off"><span class="cnt" id="tc"></span></div>
 <div class="list" id="tr"></div>`;
 const inp=$('#tq');
 const draw=()=>{const words=norm(tq).split(/\s+/).filter(Boolean);
  const l=words.length?TL.filter(t=>words.every(w=>t.nn.includes(w)||t.id.startsWith(w))):TL;
  const MAX=100,sh=l.slice(0,MAX);
  $('#tc').textContent=l.length+' docente'+(l.length===1?'':'s')+(l.length>MAX?` · mostrando ${MAX}`:'');
  $('#tr').innerHTML=sh.map(t=>`<div class="trow" onclick="go('#/docentes/${encodeURIComponent(t.id)}')"><span class="n">${hl(t.n,words)}<small>Cód. ${esc(t.id)} · ${t.progs.slice(0,6).join(', ')}${t.progs.length>6?'…':''}</small></span><span class="s">${t.nrcs} secc. · ${t.courses} curso${t.courses===1?'':'s'}</span></div>`).join('')
   +(l.length?(l.length>MAX?`<div class="empty">Hay ${l.length-MAX} resultados más. Afina la búsqueda para verlos.</div>`:''):'<div class="empty">Sin resultados</div>')};
 inp.oninput=()=>{tq=inp.value;draw()};draw();if(!matchMedia('(pointer:coarse)').matches)inp.focus()}
function viewTeacher(id){const t=T.get(id);
 if(!t){crumbsT();app.innerHTML='<div class="empty">Docente no encontrado. <a href="#/docentes" style="color:var(--pri)">Volver al buscador</a></div>';return}
 crumbsT(t);
 const byDay={};t.items.forEach(i=>{(byDay[i.m[2]]=byDay[i.m[2]]||[]).push(i)});
 const days=Object.keys(byDay).sort((a,b)=>(ORD.indexOf(a)+1||99)-(ORD.indexOf(b)+1||99));
 let conf=0,hrs=0;
 days.forEach(d=>{const a=byDay[d];a.forEach(i=>{i.r=trange(i.m[3]);i.x=false;if(i.r[0]!=null&&i.r[1]!=null)hrs+=(i.r[1]-i.r[0])/60});
  a.sort((x,y)=>(x.r[0]??1e9)-(y.r[0]??1e9));
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const A=a[i],B=a[j];
   if(A.r[0]!=null&&B.r[0]!=null&&A.s.nrc!==B.s.nrc&&A.r[0]<B.r[1]&&B.r[0]<A.r[1]){A.x=B.x=true}}
  conf+=a.filter(i=>i.x).length});
 let h=`<h2>${esc(t.n)}</h2><p class="sub">Código ${esc(t.id)} · Programas: ${t.progs.join(', ')}</p>
 <div class="stats"><div class="stat"><b>${t.nrcs}</b><span>secciones (NRC)</span></div><div class="stat"><b>${t.courses}</b><span>cursos</span></div><div class="stat"><b>${t.items.length}</b><span>bloques horarios</span></div><div class="stat"><b>${Math.round(hrs*10)/10}</b><span>horas semanales</span></div>${conf?`<div class="stat"><b style="color:var(--bad)">${conf}</b><span>bloques con cruce</span></div>`:''}</div>`;
 h+='<div class="sec">'+days.map(d=>`<div class="dh"><span class="day">${DAYS[d]||esc(d)}</span><span class="cnt">${byDay[d].length} bloque${byDay[d].length===1?'':'s'}</span></div>`+byDay[d].map(i=>
  `<div class="tl"><span class="hr">${esc(i.m[3])}</span><span class="what"><b><a href="#/${esc(i.p.k)}/${esc(i.c.c)}">${esc(i.c.c)} · ${esc(i.c.n)}</a></b><em>${esc(i.p.n)} · NRC ${i.s.nrc} · Secc. ${esc(i.s.sec)}</em></span><span class="tag ${i.s.cr>0?'t':'p'}">${i.s.cr>0?'Teoría':'Práctica'}</span><span class="au">${esc(i.m[0])} · Aula ${esc(i.m[1])}</span>${i.x?'<span class="tag x">Cruce</span>':''}</div>`).join('')).join('')+'</div>';
 app.innerHTML=h}
function bind(){const i=$('#q');if(i){i.oninput=()=>{q=i.value;const pos=i.selectionStart;route(true);const n=$('#q');n.focus();n.setSelectionRange(pos,pos)}}}
function route(keep){const [,k,cc]=location.hash.split('/');$('#tdoc').classList.toggle('on',k==='docentes');
 if(k==='docentes')return cc?viewTeacher(decodeURIComponent(cc)):viewTeachers();if(!keep&&!(window._last===location.hash)){q=''}window._last=location.hash;
 const p=D.find(x=>x.k===k);if(!p)return viewPrograms();
 const c=p.c.find(x=>x.c===cc);c?viewDetail(p,c):viewCourses(p)}
addEventListener('hashchange',()=>{route();scrollTo(0,0)});route();
