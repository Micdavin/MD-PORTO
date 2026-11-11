(() => {
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const projects=PORTO_PROJECTS.map(p=>({...p,showcase:PORTO_SHOWCASE[p.id]}));
 const byId=id=>projects.find(p=>p.id===id);
 const categories=['Semua','3D & Spatial','Business Apps','Data & AI','Creative Web','Archive & Tools'];
 const labels=['All projects','3D experiences','Business systems','Data & AI','Creative web','Archive'];
 const filters=document.querySelector('.filters'),index=document.querySelector('#project-index'),dialog=document.querySelector('#project-dialog'),search=document.querySelector('#project-search');
 let category='Semua',query='',active=null,previousFocus=null;
 const accents={'3D & Spatial':'spatial','Business Apps':'business','Data & AI':'data','Creative Web':'creative','Archive & Tools':'archive'};
 function projectCard(p,{floating=false,clone=false}={}){
  const s=p.showcase,shot=s.screens[0];
  return `<button type="button" class="showcase-card ${floating?'float-project':'index-row'} tone-${accents[p.category]||'business'}" data-project="${p.id}" aria-label="Lihat preview ${esc(s.title)}" ${clone?'tabindex="-1"':''}>
   <span class="card-visual">
    <span class="card-browser" aria-hidden="true"><i></i><i></i><i></i><span>${esc(p.stack[0])} / PREVIEW</span><b>&#8599;</b></span>
    <img src="${shot.src}" alt="Tampilan ${esc(s.title)}" loading="lazy" width="1440" height="900" draggable="false">
    <span class="card-view-cue" aria-hidden="true">Lihat tampilan <span>&#8599;</span></span>
   </span>
   <span class="card-content">
    <span class="card-kicker"><span class="kicker-pill">${esc(p.category)}</span><span class="live-kicker">PROJECT ${esc(p.number)}</span></span>
    <span class="card-title">${esc(s.title)}<i aria-hidden="true">&#8599;</i></span>
    <span class="card-description">${esc(p.description)}</span>
    <span class="card-tags">${p.stack.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</span>
    <span class="card-cta-btn" aria-hidden="true"><span>Kenali project</span><i>&#8599;</i></span>
   </span>
  </button>`;
 }
 const selections=[['mandarincoach','sweebv2','tradecore'],['lucky-screener','demon','pm-ai'],['potricella','fajar-abadi-masindo','logistic-shipping3d-df']];
 document.querySelector('#selected-work').innerHTML=`<div class="work-wall" aria-label="Project pilihan, klik kartu untuk melihat detail">${selections.map((ids,i)=>`<div class="work-column column-${i}"><div class="work-track"><div class="work-set">${ids.map(id=>projectCard(byId(id),{floating:true})).join('')}</div><div class="work-set work-clone" aria-hidden="true">${ids.map(id=>projectCard(byId(id),{floating:true,clone:true})).join('')}</div></div></div>`).join('')}</div>`;
 let visibleLimit=projects.length;
 filters.innerHTML=categories.map((c,i)=>`<button class="filter" data-category="${esc(c)}" aria-pressed="${i===0}">${labels[i]}<sup>${i===0?projects.length:projects.filter(p=>p.category===c).length}</sup></button>`).join('');
 function renderIndex(){
  const filtered=projects.filter(p=>(category==='Semua'||p.category===category)&&[p.name,p.folder,p.description,p.showcase.title,...p.stack,...p.features].join(' ').toLowerCase().includes(query.toLowerCase().trim()));
  index.innerHTML=filtered.slice(0,visibleLimit).map(p=>projectCard(p)).join('');
  const more=document.querySelector('#load-more');more.hidden=filtered.length<=visibleLimit;more.textContent=`Lihat lebih banyak (${Math.max(0,filtered.length-visibleLimit)})`;
  document.querySelector('#collection-progress').textContent=`${Math.min(visibleLimit,filtered.length)} dari ${filtered.length} project`;
  dispatchEvent(new CustomEvent('portfolio:index-render'));
  document.querySelector('#result-count').textContent=`${String(filtered.length).padStart(2,'0')} PROJECTS IN THE COLLECTION`;
  document.querySelector('#empty-state').hidden=!!filtered.length;
  filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.category===category));
 }
 document.querySelector('#load-more').addEventListener('click',()=>{const count=index.children.length;visibleLimit+=9;renderIndex();index.children[count]?.focus({preventScroll:true});});
 filters.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;visibleLimit=9;renderIndex();}});
 search.addEventListener('input',()=>{query=search.value;visibleLimit=9;renderIndex();});
 document.querySelector('#clear-search').addEventListener('click',()=>{query='';search.value='';category='Semua';renderIndex();search.focus();});
 document.addEventListener('click',e=>{const target=e.target.closest('[data-project]');if(target)openProject(target.dataset.project);});
 function openProject(id,historyChange=true){
  const p=byId(id);if(!p)return;
  active=p;previousFocus=document.activeElement;
  if(previousFocus?.closest('.work-clone'))previousFocus=document.querySelector(`.work-set:not(.work-clone) [data-project="${id}"]`);
  document.querySelector('#dialog-title').textContent=p.showcase.title;
  document.querySelector('#viewer-category').textContent=p.category+' / Project '+p.number;
  document.querySelector('.viewer-info').innerHTML=`<p class="eyebrow">ABOUT THE PROJECT</p><h3>${esc(p.showcase.title)}</h3><p>${esc(p.description)}</p><h4>FEATURE HIGHLIGHTS</h4><ul>${p.features.map((f,i)=>`<li><span>0${i+1}</span>${esc(f)}</li>`).join('')}</ul><h4>BUILT WITH</h4><div class="skills">${p.stack.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${p.credit?`<div class="provenance"><p class="source-credit">${esc(p.credit)}</p></div>`:''}`;
  const stage=document.querySelector('.viewer-stage'),shot=p.showcase.screens[0];
  stage.classList.remove('has-live');
  stage.innerHTML=`<img class="screen-display" src="${shot.src}" alt="${esc(p.showcase.title)}: satu halaman preview" width="1440" height="900" draggable="false">`;
  document.querySelector('.viewer-type').textContent='PROJECT SHOWCASE';
  document.querySelector('.viewer-bottom').innerHTML='<p>Lihat desainnya lebih dekat. Perbesar untuk mengeksplorasi detail tampilan.</p>';
  const zoom=document.querySelector('#zoom-preview');zoom.setAttribute('aria-pressed','false');zoom.textContent='Perbesar tampilan';
  if(!dialog.open)dialog.showModal();document.body.classList.add('dialog-open');
  if(historyChange)history.pushState(null,'',`#project/${id}`);
 }
 document.querySelector('#zoom-preview').addEventListener('click',()=>{
  const image=dialog.querySelector('.screen-display');if(!image)return;
  const zoomed=image.classList.toggle('zoomed'),button=document.querySelector('#zoom-preview');
  button.setAttribute('aria-pressed',String(zoomed));button.textContent=zoomed?'Sesuaikan layar':'Perbesar tampilan';
 });
 function closeProject(){if(dialog.open)dialog.close();}
 document.querySelector('.close-dialog').addEventListener('click',closeProject);
 document.querySelector('.viewer-brand').addEventListener('click',closeProject);
 dialog.addEventListener('close',()=>{if(dialog.open)return;document.body.classList.remove('dialog-open');document.querySelector('.viewer-stage').innerHTML='';if(location.hash.startsWith('#project/'))history.replaceState(null,'','#archive');previousFocus?.focus();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open){e.preventDefault();closeProject();}});
 function syncHash(){if(location.hash.startsWith('#project/'))openProject(decodeURIComponent(location.hash.slice(9)),false);else closeProject();}
 addEventListener('hashchange',syncHash);addEventListener('popstate',syncHash);
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();search.scrollIntoView({block:'center'});}});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motion=document.querySelector('#motion-toggle');
 function setMotion(paused){document.documentElement.classList.toggle('motion-paused',paused);motion.setAttribute('aria-pressed',paused);motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-label',paused?'Jalankan animasi':'Jeda animasi');dispatchEvent(new CustomEvent('porto-motion',{detail:{paused}}));}
 motion.addEventListener('click',()=>setMotion(!document.documentElement.classList.contains('motion-paused')));reduced.addEventListener('change',e=>setMotion(e.matches));setMotion(reduced.matches);
 window.openProject=openProject;renderIndex();syncHash();
})();
// Progressive scroll reveals and gentle perspective on original project screens.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('[data-project-count]').forEach(el=>el.textContent=PORTO_PROJECTS.length);
 if(!('IntersectionObserver' in window))return;
 document.documentElement.classList.add('reveal-ready');
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08});
 document.querySelectorAll('.section-heading,.feature-meta,.about-copy').forEach(el=>observer.observe(el));

})();
