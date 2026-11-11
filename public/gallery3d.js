(() => {
 const holder=document.querySelector('#playground'),canvas=document.querySelector('#hero-canvas');if(!holder||!canvas)return;
 const hero=document.querySelector('.hero'),copy=document.querySelector('.hero-copy'),bar=document.querySelector('.story-track i'),number=document.querySelector('.story-number'),label=document.querySelector('.story-label'),dialog=document.querySelector('#project-dialog'),status=holder.querySelector('.visual-coordinate');
 const screens=[{id:'pm-ai',title:'PREMAN AI'},{id:'demon',title:'DEMON Studio'},{id:'tradecore',title:'TradeCore'}];
 const choices=[...holder.querySelectorAll('[data-scene-project]')];
 let shown=0,wanted=0,reveal=1,scrollChapter=0,nextShowcase=7;
 function chooseScreen(index,schedule=true){
  wanted=index;
  nextShowcase=time+8;
  choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  if(paused){shown=index;reveal=1;}
  if(schedule)wake();
 }
 choices.forEach((button,i)=>button.addEventListener('click',()=>chooseScreen(i)));
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 let engine=null,visible=true,paused=document.documentElement.classList.contains('motion-paused'),drag=false,raf=0,last=0,time=0,progress=0,target=0,rx=-.11,ry=-.3,tx=rx,ty=ry,lastX=0,lastY=0,geometryDirty=true,scrollDirty=true,heroTop=0,travel=1,debugAt=0,chapter=-1,paintedProgress=-1,slowTime=0,quality=1,disposed=false;
 const qualityButton=document.querySelector('#quality-toggle');
 function createCSS(){
  const target=holder.querySelector('.hero-fallback');
  target.innerHTML='<div class="css3d-world"><div class="css3d-rig">'+screens.map(s=>`<div class="css3d-card"><img src="assets/screens/${s.id}.jpg" alt="Preview project ${s.id}" draggable="false"></div>`).join('')+'</div><div class="css3d-cube">'+Array.from({length:6},(_,i)=>`<i class="cube-face face-${i}"></i>`).join('')+'</div></div>';
  const rig=target.querySelector('.css3d-rig'),cube=target.querySelector('.css3d-cube'),cards=[...target.querySelectorAll('.css3d-card')];
  const world=target.querySelector('.css3d-world');
  return {kind:'css3d',hitTest(cx,cy){const card=cards[shown],r=card.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom?screens[shown].id:null},resize(w,h){world.style.transform=`translate(-50%,-50%) scale(${Math.min(w/540,h/400)})`},quality(){},dispose(){target.innerHTML=''},render(t,p,x,y){
   rig.style.transform=`translateY(${Math.sin(t*.7)*6}px) rotateX(${x*57.3+Math.sin(p*Math.PI*2)*6}deg) rotateY(${y*57.3+Math.sin(t*.45)*7+Math.sin(p*Math.PI*2)*14}deg) rotateZ(${Math.sin(t*.3)*1.5}deg)`;
   cards.forEach((card,i)=>{card.hidden=i!==shown;card.style.opacity=reveal;card.style.transform=`translate(-50%,-50%) translateY(${Math.sin(t*.65)*5}px) scale(${.96+reveal*.04})`});
   cube.style.transform=`rotateX(${t*16+p*110}deg) rotateY(${t*21+p*145}deg) rotateZ(15deg)`;
  }};
 }
 function createWebGL(){
  const T=window.THREE;if(!T)return null;
  let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{return null;}
  let width=1,height=1;
  const baseRatio=Math.min(devicePixelRatio,innerWidth<800?1.1:1.35),resources=[];
  const track=r=>{resources.push(r);return r};
  renderer.setPixelRatio(baseRatio);renderer.setClearColor(0x000000,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.1,80);camera.position.set(.25,.15,15);
  scene.add(new T.AmbientLight(0xffffff,2.2));const light=new T.DirectionalLight(0xffffff,3.2);light.position.set(-3,5,8);scene.add(light);
  const pointLight=new T.PointLight(0x38bdf8,2.8,30);pointLight.position.set(4,-3,6);scene.add(pointLight);
  const purpleLight=new T.PointLight(0x8b5cf6,2.4,30);purpleLight.position.set(-5,2,4);scene.add(purpleLight);
  const rig=new T.Group();scene.add(rig);const panels=[],screenMaterials=[];
  const shape=new T.Shape(),w=5.1,h=3.22,r=.11;
  shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const frameGeometry=track(new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.02,bevelThickness:.016,bevelSegments:2,steps:1,curveSegments:4})),planeGeometry=track(new T.PlaneGeometry(4.92,3.06)),frameMaterial=track(new T.MeshStandardMaterial({color:0x151b27,metalness:.45,roughness:.25,transparent:true}));
  let closed=false,loaded=0;holder.dataset.loadedTextures='0';
  for(const s of screens){
   const panel=new T.Group();panel.add(new T.Mesh(frameGeometry,frameMaterial));const material=track(new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,transparent:true})),screen=new T.Mesh(planeGeometry,material);screen.position.set(0,-.015,.096);panel.add(screen);rig.add(panel);panels.push(panel);screenMaterials.push(material);
   new T.TextureLoader().load(window.PORTO_SCENE_TEXTURES?.[s.id]||`assets/screens/${s.id}.jpg`,texture=>{if(closed){texture.dispose();return;}track(texture);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(2,renderer.capabilities.getMaxAnisotropy());material.map=texture;material.needsUpdate=true;holder.dataset.loadedTextures=String(++loaded);wake()},undefined,()=>{if(!closed)lightweight('texture')});
  }
  const knot=new T.Mesh(track(new T.TorusKnotGeometry(.58,.17,64,12,2,3)),track(new T.MeshStandardMaterial({color:0x6366f1,roughness:.18,metalness:.65})));scene.add(knot);
  const orbit=new T.Mesh(track(new T.TorusGeometry(.37,.014,6,48)),track(new T.MeshStandardMaterial({color:0x38bdf8,metalness:.6,roughness:.2})));orbit.position.set(-2.3,-.9,1.3);orbit.rotation.set(.8,.4,-.3);scene.add(orbit);
  // A spatial instrument behind the interface: two orbit paths and moving nodes.
  // All decorative geometry stays behind the single readable project screen.
  const instrument=new T.Group();scene.add(instrument);
  const orbitMaterial=track(new T.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.28}));
  const orbitGeometry=track(new T.TorusGeometry(2.95,.009,4,120));
  const tracks=[new T.Mesh(orbitGeometry,orbitMaterial),new T.Mesh(orbitGeometry,orbitMaterial)];
  tracks.forEach(track=>{track.scale.y=.64;instrument.add(track)});tracks[0].rotation.set(.45,.2,.12);tracks[1].rotation.set(-.4,-.25,-.12);
  const nodeGeometry=track(new T.IcosahedronGeometry(.065,0));
  const nodeMaterial=track(new T.MeshBasicMaterial({color:0x7dd3fc}));
  const nodes=Array.from({length:6},()=>{const node=new T.Mesh(nodeGeometry,nodeMaterial);instrument.add(node);return node});
  const crystal=new T.Mesh(track(new T.IcosahedronGeometry(.29,0)),track(new T.MeshStandardMaterial({color:0x7dd3fc,metalness:.8,roughness:.18,wireframe:true})));scene.add(crystal);
  function pose(t,p,x,y){
   const entrance=paused?1:1-Math.exp(-t*2.4),journey=Math.sin(p*Math.PI*2),transition=1-reveal;
   rig.rotation.set(x+journey*.07+Math.sin(t*.5)*.025,y+journey*.18+Math.sin(t*.45)*.10+(1-entrance)*.25+transition*.20,Math.sin(t*.3+p*3)*.025);
   rig.position.set(Math.sin(t*.3)*.07,Math.sin(t*.7)*.10+(1-entrance)*-.32,Math.sin(p*Math.PI)*.30);
   panels.forEach((panel,i)=>{panel.visible=i===shown;panel.scale.setScalar((.91+reveal*.09)*(.88+entrance*.12));screenMaterials[i].opacity=reveal});frameMaterial.opacity=reveal;
   knot.position.set(3.35+Math.sin(t*.45+p*2)*.15,1.90+Math.sin(t*.8)*.12,-3.3);knot.scale.setScalar(.85);knot.rotation.set(t*.32+p*2,t*.4+p*3,p);
   orbit.position.set(-3.4,-1.9+Math.cos(t*.6)*.12,-3.3);orbit.rotation.set(.8+Math.sin(t*.6)*.3,.4+p,-.3+t*.24+p*2);
   instrument.position.z=-4.5;instrument.rotation.set(Math.sin(t*.2)*.08,Math.sin(p*Math.PI)*.15,Math.sin(t*.25)*.12+p*.12);
   nodes.forEach((node,i)=>{const a=t*.22+i*Math.PI/3+p*1.4;node.position.set(Math.cos(a)*2.95,Math.sin(a)*1.75,Math.sin(a)*.6)});
   crystal.position.set(-3.35,1.9+Math.sin(t*.65)*.12,-3.3);crystal.rotation.set(t*.4,t*.5,p*2);
  }
  const meshes=[];scene.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();meshes.push(o)}});
  function corners(objects=meshes){scene.updateMatrixWorld(true);return objects.flatMap(mesh=>{const b=mesh.geometry.boundingBox,result=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])result.push(new T.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld));return result})}
  // Fit once per viewport to the full permitted motion, not just the starting pose.
  // A fixed fit while dragging avoids a camera that visibly zooms in and out.
  const envelope=[];
  for(const t of [0,3,8,15,25,40])for(const p of [0,.25,.5,.75,1])for(const x of [-.18,.18])for(const y of [-.4,.35]){pose(t,p,x,y);envelope.push(...corners())}
  const raycaster=new T.Raycaster(),mouse=new T.Vector2();
  function hitTest(clientX,clientY){
   const rect=canvas.getBoundingClientRect();
   mouse.x=((clientX-rect.left)/rect.width)*2-1;
   mouse.y=-((clientY-rect.top)/rect.height)*2+1;
   raycaster.setFromCamera(mouse,camera);
   const hits=raycaster.intersectObjects(panels.filter(panel=>panel.visible),true);
   if(hits.length>0){
    let obj=hits[0].object;while(obj&&!panels.includes(obj))obj=obj.parent;
    const index=panels.indexOf(obj);if(index!==-1)return screens[index]?.id;
   }
   return null;
  }
  if(new URLSearchParams(location.search).has('scene-check'))window.portoSceneBounds=()=>{camera.updateMatrixWorld();const points=corners().map(v=>v.project(camera)),screen=corners(panels[shown].children).map(v=>v.project(camera));return {left:Math.min(...points.map(v=>v.x)),right:Math.max(...points.map(v=>v.x)),bottom:Math.min(...points.map(v=>v.y)),top:Math.max(...points.map(v=>v.y)),width,height,cameraZ:camera.position.z,screenWidth:(Math.max(...screen.map(v=>v.x))-Math.min(...screen.map(v=>v.x)))*width/2,visiblePanels:panels.filter(panel=>panel.visible).length,activeProject:screens[shown].id,screenRotation:{x:rig.rotation.x,y:rig.rotation.y,z:rig.rotation.z},rotation:{x:rx,y:ry},target:{x:tx,y:ty}}};
  return {kind:'webgl',hitTest,resize(w,h){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;const vertical=Math.tan(camera.fov*Math.PI/360),horizontal=vertical*camera.aspect;let distance=0;for(const point of envelope)distance=Math.max(distance,point.z+Math.abs(point.x-camera.position.x)/(horizontal*.95),point.z+Math.abs(point.y-camera.position.y)/(vertical*.95));camera.position.z=distance*1.03;camera.updateProjectionMatrix()},quality(ratio){renderer.setPixelRatio(Math.max(.7,baseRatio*ratio));renderer.setSize(width,height,false)},dispose(){closed=true;resources.forEach(r=>r.dispose());renderer.dispose();delete window.portoSceneBounds},render(t,p,x,y){pose(t,p,x,y);renderer.render(scene,camera)}};
 }
 function activate(next,reason){
  engine?.dispose();engine=next;holder.classList.toggle('webgl-ready',engine.kind==='webgl');holder.classList.toggle('css3d-ready',engine.kind==='css3d');holder.dataset.renderer=engine.kind;holder.dataset.quality=engine.kind==='webgl'?'auto':'light';
  status.textContent=engine.kind==='webgl'?'3D / INTERACTIVE':'3D / MODE RINGAN';status.title=engine.kind==='webgl'?'Geser untuk memutar. Scroll untuk mengubah perspektif.':'Animasi perspektif 3D yang lebih ringan.';
  if(qualityButton){qualityButton.textContent=engine.kind==='webgl'?'Mode ringan':'Mode ringan aktif';qualityButton.disabled=engine.kind==='css3d';qualityButton.setAttribute('aria-pressed',String(engine.kind==='css3d'))}
  geometryDirty=true;last=0;slowTime=0;wake();
 }
 function lightweight(reason){if(engine?.kind==='css3d'||disposed)return;activate(createCSS(),reason)}
 function readGeometry(){
  const rect=hero.getBoundingClientRect();heroTop=rect.top+scrollY;travel=Math.max(1,rect.height-innerHeight);const bounds=canvas.getBoundingClientRect();engine.resize(Math.max(1,bounds.width),Math.max(1,bounds.height));geometryDirty=false;scrollDirty=true;
 }
 function paintStory(now){
  if(Math.abs(progress-paintedProgress)>.002){paintedProgress=progress;bar.style.transform=`scaleX(${.12+progress*.88})`;copy.style.transform=`translate3d(0,${progress*(innerWidth<800?-8:-24)}px,0)`;}
  const next=shown;if(next!==chapter){chapter=next;number.textContent=`0${next+1} / 03`;label.textContent=['Machine data.','Visual reports.','Business flow.'][next]}
  if(now-debugAt>200){debugAt=now;holder.dataset.scrollProgress=progress.toFixed(3);holder.dataset.animationTime=time.toFixed(3)}
 }
 function tick(now){
  raf=0;if(disposed||!engine||!visible||document.hidden||dialog.open){last=0;return;}
  const raw=last?(now-last)/1000:1/60,dt=Math.min(raw,.08);last=now;
  // Read geometry before writing styles. Avoid inheritable per-frame CSS variables.
  if(geometryDirty)readGeometry();if(scrollDirty){if(!paused)target=clamp((scrollY-heroTop)/travel,0,1);scrollDirty=false;}
  if(!paused){time+=dt;progress+=(target-progress)*(1-Math.exp(-7*dt));}
  const nextChapter=Math.min(2,Math.floor(progress*3));
  if(nextChapter!==scrollChapter){scrollChapter=nextChapter;chooseScreen(nextChapter,false)}
  else if(!paused&&!drag&&time>=nextShowcase)chooseScreen((wanted+1)%screens.length,false);
  if(shown!==wanted){reveal=Math.max(0,reveal-dt*6);if(reveal===0)shown=wanted}else reveal=Math.min(1,reveal+dt*5);
  if(holder.dataset.activeProject!==screens[shown].id){holder.dataset.activeProject=screens[shown].id;canvas.setAttribute('aria-label',`${screens[shown].title}, preview 3D. Geser untuk memutar; klik untuk membuka project.`)}
  const ease=1-Math.exp(-10*dt);rx+=(tx-rx)*ease;ry+=(ty-ry)*ease;
  try{engine.render(time,progress,rx,ry)}catch{lightweight('render');return}
  paintStory(now);
  // Sustained slow frames lower raster cost, then use compositor-based 3D.
  if(engine.kind==='webgl'&&!paused){slowTime=raw>.033?slowTime+Math.min(raw,.1):Math.max(0,slowTime-dt*.5);if(slowTime>2.5&&quality===1){quality=.72;engine.quality(quality);holder.dataset.quality='balanced';slowTime=0}else if(slowTime>4&&quality<1){lightweight('performance');return}}
  if(!paused||drag||shown!==wanted||reveal<1||Math.abs(tx-rx)+Math.abs(ty-ry)>.001)raf=requestAnimationFrame(tick);
 }
 function wake(){if(!disposed&&!raf&&engine&&visible&&!document.hidden&&!dialog.open){last=0;raf=requestAnimationFrame(tick)}}
 let downX=0,downY=0;
 holder.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;downX=e.clientX;downY=e.clientY;lastX=e.clientX;lastY=e.clientY;holder.setPointerCapture(e.pointerId);wake()});
 holder.addEventListener('pointermove',e=>{
  if(!drag){
   const hitId=engine?.hitTest?.(e.clientX,e.clientY);
   canvas.style.cursor=hitId?'pointer':'grab';
   if(hitId)status.textContent='⚡ LIHAT PREVIEW: '+hitId.toUpperCase();
   else status.textContent=engine?.kind==='webgl'?'3D / INTERACTIVE':'3D / MODE RINGAN';
   return;
  }
  tx=clamp(tx+(e.clientY-lastY)*.004,-.18,.18);ty=clamp(ty+(e.clientX-lastX)*.006,-.4,.35);lastX=e.clientX;lastY=e.clientY;wake();
 });
 for(const name of ['pointerup','pointercancel'])holder.addEventListener(name,e=>{
  if(drag&&name==='pointerup'&&Math.hypot(e.clientX-downX,e.clientY-downY)<8){
   const hitId=engine?.hitTest?.(e.clientX,e.clientY);
   if(hitId&&window.openProject)window.openProject(hitId);
  }
  drag=false;wake();
 });
 document.querySelector('#reset-scene').addEventListener('click',()=>{tx=-.11;ty=-.3;wake()});qualityButton?.addEventListener('click',()=>lightweight('user'));
 addEventListener('porto-motion',e=>{paused=e.detail.paused;scrollDirty=true;wake()});addEventListener('scroll',()=>{scrollDirty=true;wake()},{passive:true});
 new ResizeObserver(()=>{geometryDirty=true;wake()}).observe(hero);new ResizeObserver(()=>{geometryDirty=true;wake()}).observe(holder);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;wake()}).observe(holder);
 new MutationObserver(()=>{if(!dialog.open)wake()}).observe(dialog,{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',wake);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lightweight('context-loss')});
 activate(createWebGL()||createCSS(),'initial');
 addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;if(raf)cancelAnimationFrame(raf);engine?.dispose()},{once:true});
})();
