(() => {
 const wall=document.querySelector('.work-wall'),control=document.querySelector('#gallery-motion');
 if(!wall||!control)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:900px)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 let paused=false,inView=false;
 function syncMotion(){
  const globalPause=document.documentElement.classList.contains('motion-paused'),stopped=paused||globalPause||reduced.matches;
  wall.classList.toggle('is-paused',stopped);wall.classList.toggle('is-running',inView&&!document.hidden&&!stopped&&!mobile.matches);wall.classList.toggle('is-static',reduced.matches);
  control.setAttribute('aria-pressed',String(stopped));control.disabled=globalPause||reduced.matches;
  control.querySelector('[data-gallery-label]').textContent=control.disabled?'Motion paused':paused?'Play gallery':'Pause gallery';
  control.querySelector('[data-gallery-icon]').textContent=stopped?'\u25b6':'\u2161';
  control.setAttribute('aria-label',stopped?'Jalankan animasi galeri':'Jeda animasi galeri');
 }
 control.addEventListener('click',()=>{paused=!paused;syncMotion()});
 new IntersectionObserver(([e])=>{inView=e.isIntersecting;syncMotion()},{rootMargin:'80px'}).observe(wall);
 addEventListener('porto-motion',syncMotion);document.addEventListener('visibilitychange',syncMotion);reduced.addEventListener('change',syncMotion);mobile.addEventListener('change',()=>{syncMotion();updatePosition()});syncMotion();

 const cards=[...wall.querySelectorAll('.work-set:not(.work-clone) .showcase-card')],previous=document.querySelector('#gallery-prev'),next=document.querySelector('#gallery-next'),position=document.querySelector('#gallery-position');
 let activeIndex=0,scrollFrame=0;
 function updatePosition(){
  scrollFrame=0;if(!mobile.matches)return;
  const left=wall.getBoundingClientRect().left+3;
  activeIndex=cards.reduce((nearest,card,i)=>Math.abs(card.getBoundingClientRect().left-left)<Math.abs(cards[nearest].getBoundingClientRect().left-left)?i:nearest,0);
  position.textContent=`${String(activeIndex+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;previous.disabled=activeIndex===0;next.disabled=activeIndex===cards.length-1;
 }
 wall.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updatePosition)},{passive:true});
 function step(amount){const i=Math.max(0,Math.min(cards.length-1,activeIndex+amount)),left=wall.scrollLeft+cards[i].getBoundingClientRect().left-wall.getBoundingClientRect().left-3;wall.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});}
 previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));addEventListener('resize',updatePosition);updatePosition();

 const cursor=document.createElement('div');cursor.className='project-cursor';cursor.setAttribute('aria-hidden','true');cursor.textContent='VIEW \u2197';document.body.append(cursor);
 let cursorFrame=0,pointerX=0,pointerY=0,hovered=null,visual=null;
 function hideCursor(){
  if(hovered){hovered.style.setProperty('--tilt-x','0deg');hovered.style.setProperty('--tilt-y','0deg');}
  cursor.classList.remove('is-active');document.body.classList.remove('custom-project-cursor');hovered=null;visual=null;
 }
 document.addEventListener('pointermove',e=>{
  if(!fine.matches||mobile.matches||reduced.matches||document.querySelector('#project-dialog').open){hideCursor();return;}
  const nextHovered=e.target.closest('.showcase-card');
  if(hovered&&hovered!==nextHovered){hovered.style.setProperty('--tilt-x','0deg');hovered.style.setProperty('--tilt-y','0deg');}
  hovered=nextHovered;visual=e.target.closest('.card-visual');pointerX=e.clientX;pointerY=e.clientY;
  if(!hovered){hideCursor();return;}
  if(!cursorFrame)cursorFrame=requestAnimationFrame(()=>{
   cursorFrame=0;if(!hovered)return;
   const rect=hovered.getBoundingClientRect();
   const px=pointerX-rect.left,py=pointerY-rect.top;
   hovered.style.setProperty('--pointer-x',`${px}px`);
   hovered.style.setProperty('--pointer-y',`${py}px`);
   const tiltX=(((py-rect.height/2)/(rect.height/2))*-5).toFixed(2);
   const tiltY=(((px-rect.width/2)/(rect.width/2))*5).toFixed(2);
   hovered.style.setProperty('--tilt-x',`${tiltX}deg`);
   hovered.style.setProperty('--tilt-y',`${tiltY}deg`);
   cursor.style.left=`${pointerX}px`;cursor.style.top=`${pointerY}px`;
   cursor.classList.toggle('is-active',!!visual);
   document.body.classList.toggle('custom-project-cursor',!!visual);
  });
 },{passive:true});
 document.addEventListener('pointerleave',hideCursor);
 document.addEventListener('click',hideCursor);
 addEventListener('scroll',hideCursor,{passive:true});
 document.addEventListener('keydown',hideCursor);
 fine.addEventListener('change',hideCursor);
 reduced.addEventListener('change',hideCursor);

 // Observe newly rendered search/filter results too; never hide cards without JS.
 const arrivals=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('card-enter');arrivals.unobserve(target)}}),{threshold:.06});
 function observeCollection(){arrivals.disconnect();document.querySelectorAll('.collection-grid .showcase-card').forEach((el,i)=>{el.style.setProperty('--entry-delay',`${(i%3)*65}ms`);arrivals.observe(el)})}
 addEventListener('portfolio:index-render',observeCollection);observeCollection();
})();

// Section motion runs only while needed; the 3D scene owns its own render loop.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),isPaused=()=>reduced.matches||document.documentElement.classList.contains('motion-paused');
 const reveals=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveals.unobserve(e.target)}}),{threshold:.08});
 document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('reveal-pending');reveals.observe(el)});
 const ambient=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('ambient-active',e.isIntersecting)),{threshold:.1});
 document.querySelectorAll('[data-ambient]').forEach(el=>ambient.observe(el));
 const counts={projects:PORTO_PROJECTS.length,categories:new Set(PORTO_PROJECTS.map(p=>p.category)).size,selected:document.querySelectorAll('.work-set:not(.work-clone) [data-project]').length};
 const counters=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;counters.unobserve(target);const total=counts[target.dataset.count];if(isPaused()){target.textContent=total;return;}
  let start=null,last=-1;function animate(now){start??=now;const t=Math.min(1,(now-start)/900),value=isPaused()?total:Math.round(total*(1-Math.pow(1-t,3)));if(value!==last){target.textContent=value;last=value;}if(t<1&&!isPaused())requestAnimationFrame(animate)}requestAnimationFrame(animate);
 }),{threshold:1});
 document.querySelectorAll('[data-count]').forEach(el=>{el.textContent=counts[el.dataset.count];counters.observe(el)});
 const progress=document.querySelector('.reading-progress i'),back=document.querySelector('#back-to-top');let scheduled=0,dirty=true,height=1,backVisible=false;
 function update(){scheduled=0;if(dirty){height=Math.max(1,document.documentElement.scrollHeight-innerHeight);dirty=false;}const y=scrollY;progress.style.transform=`scaleX(${Math.min(1,y/height)})`;if((y>innerHeight)!==backVisible){backVisible=y>innerHeight;back.classList.toggle('is-visible',backVisible)}}
 function schedule(){if(!scheduled)scheduled=requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{dirty=true;schedule()});new ResizeObserver(()=>{dirty=true;schedule()}).observe(document.body);
 back.addEventListener('click',()=>{scrollTo({top:0,behavior:isPaused()?'instant':'smooth'});document.querySelector('.brand').focus({preventScroll:true})});schedule();
 const navLinks=[...document.querySelectorAll('.site-header nav a')];
 new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}),{rootMargin:'-20% 0px -65%'}).observe(document.querySelector('#home'));
 const navigation=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.hash==='#'+e.target.id?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current'))}),{rootMargin:'-20% 0px -65%'});
 navLinks.forEach(a=>{const section=document.querySelector(a.hash);if(section)navigation.observe(section)});

 // Interactive focus widgets (mini-rack, mini-chart, mini-flow)
 const toast=document.querySelector('#toast');let toastTimer=null;
 function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);}

 const rackItems=document.querySelectorAll('.mini-rack i');
 rackItems.forEach((shelf,i)=>{
  shelf.style.cursor='pointer';
  shelf.setAttribute('title',`Klik untuk inspeksi Rak #${i+1}`);
  shelf.addEventListener('click',()=>{
   rackItems.forEach(s=>s.classList.remove('is-active'));
   shelf.classList.add('is-active');
   const count=Math.floor(Math.random()*80+40);
   showToast(`📦 Rak ${String.fromCharCode(65+Math.floor(i/2))}-0${(i%2)+1}: ${count} sparepart ready (Klik coba SWEEB 3D)`);
  });
 });

 const chart=document.querySelector('.mini-chart');
 if(chart){
  const bars=chart.querySelectorAll('i');
  bars.forEach((bar,i)=>{
   bar.style.cursor='pointer';
   bar.setAttribute('title','Klik untuk uji data telemetri');
   bar.addEventListener('click',()=>{
    bars.forEach(b=>{const rand=Math.floor(Math.random()*55+40);b.style.height=`${rand}%`;});
    const peak=Math.floor(Math.random()*8+92);
    showToast(`📊 Telemetri Kompresor: ${peak}.4% Efisiensi — Kondisi Prima`);
   });
  });
 }

 const flow=document.querySelector('.mini-flow');
 if(flow){
  const nodes=flow.querySelectorAll('i');
  nodes.forEach((node,i)=>{
   node.style.cursor='pointer';
   node.setAttribute('title','Klik untuk simulasi alur transaksi');
   node.addEventListener('click',()=>{
    nodes.forEach((n,idx)=>{
     setTimeout(()=>{n.classList.add('is-active');setTimeout(()=>n.classList.remove('is-active'),600);},idx*180);
    });
    const steps=['Form Input Terisi','Verifikasi Dokumen Valid','Approval Disetujui & Sinkron'];
    showToast(`⚡ Workflow: ${steps[i]||'Proses Selesai'}`);
   });
  });
 }
})();
