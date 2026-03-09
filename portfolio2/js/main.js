'use strict';

/* ─── MOBILE DETECTION ───────────────────────────────────────────── */
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/* ─── LOADER ─────────────────────────────────────────────────────── */
const loader      = document.getElementById('loader');
const loaderFill  = document.getElementById('loaderFill');
const loaderPct   = document.getElementById('loaderPct');
const loaderStatus= document.getElementById('loaderStatus');
const statuses    = ['Initializing...','Loading assets...','Building scene...','Compiling shaders...','Almost ready...'];
let pct = 0;
const loadTick = setInterval(() => {
  pct = Math.min(100, pct + Math.random() * 14 + 2);
  loaderFill.style.width = pct + '%';
  loaderPct.textContent  = Math.floor(pct);
  loaderStatus.textContent = statuses[Math.min(Math.floor(pct / 22), statuses.length - 1)];
  if (pct >= 100) {
    clearInterval(loadTick);
    loaderStatus.textContent = 'Ready.';
    setTimeout(() => { loader.classList.add('hidden'); initAll(); }, 500);
  }
}, 80);

/* ─── INIT ───────────────────────────────────────────────────────── */
function initAll() {
  initThree();
  initCursor();
  initScrollReveal();
  initTypewriter();
  initSkillBars();
  initSnakeThumb();
  initParticleThumb();
  fetchFollowers();
  initNav();
  document.getElementById('footerYear').textContent = new Date().getFullYear();
}

/* ─── THREE.JS HERO ──────────────────────────────────────────────── */
function initThree() {
  const canvas = document.getElementById('heroCanvas');
  // Skip if canvas doesn't exist or Three.js failed to load
  if (!canvas) return;
  if (typeof THREE === 'undefined') {
    console.warn('Three.js failed to load - skipping 3D hero animation');
    canvas.style.display = 'none';
    return;
  }
  try {
  const scene    = new THREE.Scene();
  const W = window.innerWidth, H = window.innerHeight;
  const camera   = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
  camera.position.z = 10;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  const masterGrp = new THREE.Group();
  scene.add(masterGrp);

  // Outer wireframe icosahedron
  const outerMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.8, 1),
    new THREE.MeshBasicMaterial({ color:0x00ffcc, wireframe:true, transparent:true, opacity:0.22 })
  );
  masterGrp.add(outerMesh);

  // Inner icosahedron
  const innerMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 0),
    new THREE.MeshBasicMaterial({ color:0xff0066, wireframe:true, transparent:true, opacity:0.18 })
  );
  masterGrp.add(innerMesh);

  // Torus rings
  const torusGeo = new THREE.TorusGeometry(5, 0.04, 4, 120);
  const t1 = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color:0x8833ff, transparent:true, opacity:0.35 }));
  t1.rotation.x = Math.PI/3;
  masterGrp.add(t1);
  const t2 = new THREE.Mesh(torusGeo.clone(), new THREE.MeshBasicMaterial({ color:0x00ffcc, transparent:true, opacity:0.18 }));
  t2.rotation.x = -Math.PI/5; t2.rotation.y = Math.PI/4;
  masterGrp.add(t2);

  // Floating orbs
  const orbGrp = new THREE.Group(); scene.add(orbGrp);
  [[ 5,3,-2],[-6,-2,-3],[4,-4,1],[-3,4,-1],[6,0,-4],[-5,3,2]].forEach(([x,y,z],i) => {
    const m = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3+Math.random()*0.25, 0),
      new THREE.MeshBasicMaterial({ color:i%2===0?0x00ffcc:0xff0066, wireframe:true, transparent:true, opacity:0.4 })
    );
    m.position.set(x,y,z);
    m.userData = { baseY:y, spd:0.3+Math.random()*0.5 };
    orbGrp.add(m);
  });

  // Stars
  const mkStars = (count, col, sz) => {
    const pos = new Float32Array(count*3);
    for (let i=0;i<count;i++) { pos[i*3]=(Math.random()-.5)*80; pos[i*3+1]=(Math.random()-.5)*80; pos[i*3+2]=(Math.random()-.5)*80; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color:col, size:sz, transparent:true, opacity:0.5 }));
  };
  const stars  = mkStars(2200, 0x00ffcc, 0.07); scene.add(stars);
  const stars2 = mkStars(800,  0xff0066, 0.05); scene.add(stars2);

  let mx=0, my=0;
  window.addEventListener('mousemove', e => { mx=(e.clientX/innerWidth-.5); my=(e.clientY/innerHeight-.5); });

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    outerMesh.rotation.x=t*.08; outerMesh.rotation.y=t*.12; outerMesh.rotation.z=t*.04;
    innerMesh.rotation.x=-t*.18; innerMesh.rotation.y=t*.22;
    t1.rotation.z=t*.25;
    t2.rotation.z=-t*.18; t2.rotation.x=-Math.PI/5+Math.sin(t*.3)*.2;
    orbGrp.children.forEach((o,i) => { o.position.y=o.userData.baseY+Math.sin(t*o.userData.spd+i)*.6; o.rotation.x=t*o.userData.spd; });
    masterGrp.rotation.x += (my*.4-masterGrp.rotation.x)*.06;
    masterGrp.rotation.y += (mx*.4-masterGrp.rotation.y)*.06;
    stars.rotation.y=t*.008; stars2.rotation.y=-t*.006;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const W2=innerWidth, H2=innerHeight;
    camera.aspect=W2/H2; camera.updateProjectionMatrix(); renderer.setSize(W2,H2);
  });
  } catch(e) {
    console.warn('Three.js initialization failed:', e);
    canvas.style.display = 'none';
  }
}

/* ─── CURSOR ─────────────────────────────────────────────────────── */
function initCursor() {
  // Skip custom cursor on touch devices
  if (isTouchDevice) {
    document.body.style.cursor = 'auto';
    return;
  }
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  let rx=0, ry=0, cx=0, cy=0;
  document.addEventListener('mousemove', e => { cx=e.clientX; cy=e.clientY; dot.style.left=cx+'px'; dot.style.top=cy+'px'; });
  (function lerp() {
    rx+=(cx-rx)*.13; ry+=(cy-ry)*.13;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(lerp);
  })();
  document.querySelectorAll('a,button,.project-card,.showcase-card,.contact-card,.skill-card,.achievement').forEach(el => {
    el.addEventListener('mouseenter',()=>ring.classList.add('hovered'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hovered'));
  });
}

/* ─── SCROLL REVEAL ──────────────────────────────────────────────── */
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold:0.12, rootMargin:'0px 0px -60px 0px' });
  document.querySelectorAll('.reveal-up,.reveal-left,.reveal-right').forEach(el => obs.observe(el));
}

/* ─── TYPEWRITER ─────────────────────────────────────────────────── */
function initTypewriter() {
  const el = document.getElementById('heroSub'); if(!el) return;
  const phrases = ['Full Stack Developer.','Game Architect.','Lua · JavaScript · Python.','Building things that last.','From Roblox to the Web.'];
  let pi=0, ci=0, del=false;
  function tick() {
    const p=phrases[pi];
    if(!del) { ci++; el.innerHTML=p.slice(0,ci)+'<span class="cursor-char">|</span>'; if(ci===p.length){del=true;setTimeout(tick,1800);return;} setTimeout(tick,60+Math.random()*40); }
    else { ci--; el.innerHTML=p.slice(0,ci)+'<span class="cursor-char">|</span>'; if(ci===0){del=false;pi=(pi+1)%phrases.length;setTimeout(tick,300);return;} setTimeout(tick,28); }
  }
  setTimeout(tick, 2200);
}

/* ─── NAV ────────────────────────────────────────────────────────── */
function initNav() {
  const nav=document.getElementById('navWrap');
  const hbg=document.getElementById('hamburger');
  const lnk=document.getElementById('navLinks');
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>60),{passive:true});
  hbg.addEventListener('click',()=>{ hbg.classList.toggle('open'); lnk.classList.toggle('open'); });
  lnk.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ hbg.classList.remove('open'); lnk.classList.remove('open'); }));
}

/* ─── SKILL BARS ─────────────────────────────────────────────────── */
function initSkillBars() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { setTimeout(()=>{ e.target.style.width=e.target.dataset.pct+'%'; },200); obs.unobserve(e.target); } });
  }, { threshold:0.5 });
  document.querySelectorAll('.skill-fill[data-pct]').forEach(b=>obs.observe(b));
}

/* ─── ROBLOX FOLLOWER COUNT ──────────────────────────────────────── */
function fetchFollowers() {
  const userId = 8310005469;
  const setAll = (display, raw) => {
    const fc = document.getElementById('followerCount');
    const rh = document.getElementById('robloxStatHero');
    const cf = document.getElementById('codeFollowers');
    if(rh) rh.textContent = display;
    if(cf) cf.textContent = raw;
    if(fc) animCounter(fc, raw, display);
  };
  const u = `https://friends.roblox.com/v1/users/${userId}/followers/count`;
  fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`)
    .then(r=>r.json())
    .then(d=>{ const c=d.count; if(typeof c==='number'&&c>0){ setAll(c>=1000?(c/1000).toFixed(1)+'K+':String(c), c); } else throw 0; })
    .catch(()=>setAll('12K+', 12000));
}
function animCounter(el, target, fallback) {
  let cur=0; const step=Math.ceil(target/60);
  const t=setInterval(()=>{ cur+=step; if(cur>=target){clearInterval(t);el.textContent=fallback||cur.toLocaleString();} else el.textContent=cur.toLocaleString(); },25);
}

/* ─── COPY EMAIL ─────────────────────────────────────────────────── */
function copyEmail() {
  const hint=document.getElementById('copyHint');
  navigator.clipboard.writeText('truwty1@gmail.com').then(()=>{
    hint.textContent='✓ Copied!';
    hint.style.background='rgba(0,255,204,0.2)';
    hint.style.borderColor='rgba(0,255,204,0.4)';
    setTimeout(()=>{ hint.textContent='Click to copy'; hint.style.background=''; hint.style.borderColor=''; },2000);
  }).catch(()=>{ hint.textContent='truwty1@gmail.com'; });
}

/* ─── SNAKE THUMBNAIL (card preview) ────────────────────────────── */
function initSnakeThumb() {
  const cv = document.getElementById('snakeThumb'); if(!cv) return;
  const cx = cv.getContext('2d');
  const W=cv.width, H=cv.height, CELL=10, COLS=Math.floor(W/CELL), ROWS=Math.floor(H/CELL);
  const path=[]; for(let y=1;y<ROWS-1;y++){if(y%2===1){for(let x=1;x<COLS-1;x++)path.push({x,y});}else{for(let x=COLS-2;x>=1;x--)path.push({x,y});}}
  let head=0;
  function draw(){
    cx.fillStyle='#020208'; cx.fillRect(0,0,W,H);
    cx.strokeStyle='rgba(0,255,204,0.04)'; cx.lineWidth=0.5;
    for(let x=0;x<COLS;x++){cx.beginPath();cx.moveTo(x*CELL,0);cx.lineTo(x*CELL,H);cx.stroke();}
    for(let y=0;y<ROWS;y++){cx.beginPath();cx.moveTo(0,y*CELL);cx.lineTo(W,y*CELL);cx.stroke();}
    const vis=path.slice(head,head+18);
    vis.forEach((s,i)=>{
      const a=1-(i/vis.length)*.8;
      cx.shadowColor='#00ffcc'; cx.shadowBlur=i===0?12:4;
      cx.fillStyle=`rgba(0,255,204,${a})`;
      cx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2);
    });
    cx.shadowBlur=0;
    cx.shadowColor='#ff0066'; cx.shadowBlur=10; cx.fillStyle='#ff0066';
    cx.fillRect(18*CELL+2,6*CELL+2,CELL-4,CELL-4); cx.shadowBlur=0;
  }
  setInterval(()=>{ head=(head+1)%(path.length-18); draw(); },100);
  draw();
}

/* ─── PARTICLE THUMBNAIL ─────────────────────────────────────────── */
function initParticleThumb() {
  const cv = document.getElementById('partThumb'); if(!cv) return;
  const cx = cv.getContext('2d');
  const W=cv.width, H=cv.height;
  const pts=Array.from({length:40},()=>({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*1.2, vy:(Math.random()-.5)*1.2-.4, r:Math.random()*4+1, hue:[165,330,275][Math.floor(Math.random()*3)], life:Math.random() }));
  (function draw(){
    cx.fillStyle='rgba(2,2,8,0.3)'; cx.fillRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life-=0.005;
      if(p.life<=0||p.y>H+20){p.x=Math.random()*W;p.y=H+5;p.vx=(Math.random()-.5)*2;p.vy=-Math.random()*3-1;p.life=0.9;p.hue=[165,330,275][Math.floor(Math.random()*3)];}
      cx.shadowColor=`hsl(${p.hue},100%,60%)`; cx.shadowBlur=8;
      cx.fillStyle=`hsla(${p.hue},100%,60%,${p.life})`;
      cx.beginPath(); cx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2); cx.fill();
    });
    cx.shadowBlur=0;
    requestAnimationFrame(draw);
  })();
}

/* ═══════════════════════════════════════════════════════════════════
   DEMO SYSTEM
═══════════════════════════════════════════════════════════════════ */
const demoOverlay = document.getElementById('demoOverlay');
const demoBox     = document.getElementById('demoBox');
const demoContent = document.getElementById('demoContent');
const demoClose   = document.getElementById('demoClose');

let activeDemo=null, snakeInterval=null, pLoop=null;
let keyHandler=null;

function openDemo(type) {
  activeDemo=type;
  demoContent.innerHTML='';
  demoOverlay.classList.add('open');
  document.body.style.overflow='hidden';
  if(type==='snake')    startSnakeDemo();
  if(type==='particles') startParticlesDemo();
  if(type==='terminal') startTerminalDemo();
}

function closeDemo() {
  demoOverlay.classList.remove('open');
  document.body.style.overflow='';
  if(snakeInterval){ clearInterval(snakeInterval); snakeInterval=null; }
  if(pLoop){ cancelAnimationFrame(pLoop); pLoop=null; }
  if(keyHandler){ document.removeEventListener('keydown',keyHandler); keyHandler=null; }
  activeDemo=null;
  setTimeout(()=>{ demoContent.innerHTML=''; },400);
}

demoOverlay.addEventListener('click', e=>{ if(e.target===demoOverlay) closeDemo(); });
demoClose.addEventListener('click', closeDemo);
document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&activeDemo) closeDemo(); });

/* ──────────────────────────────────────────────────────────────────
   SNAKE DEMO
────────────────────────────────────────────────────────────────── */
function startSnakeDemo() {
  demoContent.innerHTML=`
    <p class="demo-title">Neon Snake</p>
    <p class="demo-sub">Arrow Keys or WASD to move &nbsp;·&nbsp; R = restart &nbsp;·&nbsp; Don't bite yourself</p>
    <div class="demo-snake-wrap">
      <canvas id="snakeCanvas" width="480" height="480" style="max-width:100%"></canvas>
      <div class="snake-ui">
        <div>Score: <strong id="snScore">0</strong></div>
        <div>Best: <strong id="snBest">0</strong></div>
        <button class="demo-restart-btn" id="snRestart">↺ RESTART</button>
      </div>
    </div>`;

  const cv   = document.getElementById('snakeCanvas');
  const ctx  = cv.getContext('2d');
  const CELL=20, COLS=24, ROWS=24;
  const scoreEl=document.getElementById('snScore');
  const bestEl =document.getElementById('snBest');
  document.getElementById('snRestart').addEventListener('click', startGame);

  let snake, dir, nextDir, food, score, best=0, running;

  function rnd(){return{x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}
  function placeFood(){do{food=rnd();}while(snake.some(s=>s.x===food.x&&s.y===food.y));}

  function startGame(){
    if(snakeInterval) clearInterval(snakeInterval);
    snake=[{x:12,y:12},{x:11,y:12},{x:10,y:12},{x:9,y:12},{x:8,y:12}];
    dir={x:1,y:0}; nextDir={x:1,y:0};
    score=0; running=true;
    scoreEl.textContent='0';
    placeFood();
    snakeInterval=setInterval(tick, 110);
  }

  function tick(){
    if(!running) return;
    dir=nextDir;
    const h={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if(h.x<0||h.x>=COLS||h.y<0||h.y>=ROWS||snake.some(s=>s.x===h.x&&s.y===h.y)){die();return;}
    snake.unshift(h);
    if(h.x===food.x&&h.y===food.y){
      score++; scoreEl.textContent=score;
      if(score>best){best=score;bestEl.textContent=best;}
      placeFood();
      if(score%5===0&&snakeInterval){clearInterval(snakeInterval);snakeInterval=setInterval(tick,Math.max(50,110-score*3));}
    } else snake.pop();
    draw();
  }

  function draw(){
    const W=cv.width, H=cv.height;
    ctx.fillStyle='#020208'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(0,255,204,0.04)'; ctx.lineWidth=0.5;
    for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}
    // Food
    const pulse=0.5+0.5*Math.sin(Date.now()*.006);
    ctx.shadowColor='#ff0066'; ctx.shadowBlur=12+pulse*10;
    ctx.fillStyle='#ff0066'; ctx.fillRect(food.x*CELL+3,food.y*CELL+3,CELL-6,CELL-6);
    ctx.fillStyle='#ffaacc'; ctx.fillRect(food.x*CELL+6,food.y*CELL+6,CELL-12,CELL-12);
    ctx.shadowBlur=0;
    // Snake
    snake.forEach((s,i)=>{
      const a=Math.max(0.2,1-(i/snake.length)*.78);
      ctx.shadowColor='#00ffcc'; ctx.shadowBlur=i===0?18:6;
      ctx.fillStyle=`rgba(0,${Math.floor(255*a)},${Math.floor(204*a)},${a})`;
      ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2);
      if(i===0){ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(s.x*CELL+5,s.y*CELL+5,CELL-10,CELL-10);}
    });
    ctx.shadowBlur=0;
  }

  function die(){
    running=false; clearInterval(snakeInterval); snakeInterval=null;
    const W=cv.width, H=cv.height;
    ctx.fillStyle='rgba(2,2,8,0.82)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.shadowColor='#ff0066'; ctx.shadowBlur=30; ctx.fillStyle='#ff0066';
    ctx.font='bold 34px Orbitron,monospace'; ctx.fillText('GAME OVER',W/2,H/2-36);
    ctx.shadowColor='#00ffcc'; ctx.shadowBlur=15; ctx.fillStyle='#00ffcc';
    ctx.font='bold 18px Orbitron,monospace'; ctx.fillText(`SCORE: ${score}`,W/2,H/2+8);
    ctx.shadowBlur=0; ctx.fillStyle='rgba(200,200,220,0.5)';
    ctx.font='13px JetBrains Mono,monospace'; ctx.fillText('R or RESTART to play again',W/2,H/2+44);
  }

  keyHandler=function(e){
    if(!activeDemo) return;
    const map={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r',W:'u',S:'d',A:'l',D:'r'};
    const act=map[e.key]; if(!act) return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    if(act==='u'&&dir.y!==1)  nextDir={x:0,y:-1};
    if(act==='d'&&dir.y!==-1) nextDir={x:0,y:1};
    if(act==='l'&&dir.x!==1)  nextDir={x:-1,y:0};
    if(act==='r'&&dir.x!==-1) nextDir={x:1,y:0};
    if(e.key==='r'||e.key==='R') startGame();
  };
  document.addEventListener('keydown', keyHandler);
  
  // Touch/swipe controls for Snake
  let touchStartX=0, touchStartY=0;
  cv.addEventListener('touchstart', e => {
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
  }, {passive:true});
  cv.addEventListener('touchend', e => {
    if(!activeDemo) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const minSwipe = 30;
    if(Math.abs(dx) > Math.abs(dy)) {
      if(dx > minSwipe && dir.x!==-1) nextDir={x:1,y:0};
      else if(dx < -minSwipe && dir.x!==1) nextDir={x:-1,y:0};
    } else {
      if(dy > minSwipe && dir.y!==-1) nextDir={x:0,y:1};
      else if(dy < -minSwipe && dir.y!==1) nextDir={x:0,y:-1};
    }
  });
  
  startGame(); draw();
}

/* ──────────────────────────────────────────────────────────────────
   PARTICLES DEMO
────────────────────────────────────────────────────────────────── */
function startParticlesDemo() {
  demoContent.innerHTML=`
    <p class="demo-title">Particle Forge</p>
    <p class="demo-sub">Click or drag to spawn particles &nbsp;·&nbsp; Real-time physics</p>
    <div class="demo-particles-wrap">
      <canvas id="particleCanvas" width="520" height="380" style="max-width:100%;border-radius:8px;border:1px solid rgba(255,0,102,0.2)"></canvas>
      <div class="particle-ui"><span id="pcCount">0</span> particles &nbsp;·&nbsp; click &amp; drag to create</div>
    </div>`;

  const cv  = document.getElementById('particleCanvas');
  const ctx = cv.getContext('2d');
  const W=cv.width, H=cv.height;
  const countEl=document.getElementById('pcCount');
  let particles=[], isDown=false, mx=W/2, my=H/2;

  const PALETTES=[[165,100,60],[330,100,60],[275,100,65],[45,100,60]];

  class Spark {
    constructor(x,y,burst){
      this.x=x; this.y=y;
      const ang=Math.random()*Math.PI*2, spd=burst?Math.random()*9+3:Math.random()*4+1;
      this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd-(burst?4:2);
      this.life=1; this.decay=Math.random()*.018+.008;
      this.r=Math.random()*4+1.5;
      const [h,s,l]=PALETTES[Math.floor(Math.random()*PALETTES.length)];
      this.h=h; this.s=s; this.l=l;
    }
    update(){
      this.vy+=0.22; this.vx*=0.985;
      this.x+=this.vx; this.y+=this.vy;
      this.life-=this.decay;
      if(this.y>H-5){this.y=H-5;this.vy*=-.45;this.vx*=.8;}
      if(this.x<0||this.x>W) this.vx*=-.6;
    }
    draw(c){
      c.shadowColor=`hsl(${this.h},${this.s}%,${this.l}%)`;
      c.shadowBlur=12;
      c.fillStyle=`hsla(${this.h},${this.s}%,${this.l}%,${this.life})`;
      c.beginPath(); c.arc(this.x,this.y,Math.max(.5,this.r*this.life),0,Math.PI*2); c.fill();
    }
  }

  function spawn(x,y,n,burst){ if(particles.length<2000) for(let i=0;i<n;i++) particles.push(new Spark(x,y,burst)); }

  function loop(){
    if(!activeDemo||pLoop===null) return;
    ctx.fillStyle='rgba(2,2,8,0.18)'; ctx.fillRect(0,0,W,H);
    // crosshair
    ctx.strokeStyle='rgba(255,0,102,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(mx-10,my); ctx.lineTo(mx+10,my); ctx.moveTo(mx,my-10); ctx.lineTo(mx,my+10); ctx.stroke();
    if(isDown&&particles.length<2000) spawn(mx,my,3,false);
    particles=particles.filter(p=>p.life>.01);
    particles.forEach(p=>{p.update();p.draw(ctx);});
    ctx.shadowBlur=0;
    countEl.textContent=particles.length;
    pLoop=requestAnimationFrame(loop);
  }

  function getPos(e, cv){
    const r=cv.getBoundingClientRect();
    return { x:(e.clientX-r.left)*(W/r.width), y:(e.clientY-r.top)*(H/r.height) };
  }
  cv.addEventListener('mousedown',e=>{const p=getPos(e,cv);mx=p.x;my=p.y;isDown=true;spawn(mx,my,40,true);});
  cv.addEventListener('mousemove',e=>{const p=getPos(e,cv);mx=p.x;my=p.y;});
  cv.addEventListener('mouseup',()=>isDown=false);
  cv.addEventListener('mouseleave',()=>isDown=false);
  cv.addEventListener('touchstart',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),t=e.touches[0];mx=(t.clientX-r.left)*(W/r.width);my=(t.clientY-r.top)*(H/r.height);isDown=true;spawn(mx,my,40,true);},{passive:false});
  cv.addEventListener('touchmove',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),t=e.touches[0];mx=(t.clientX-r.left)*(W/r.width);my=(t.clientY-r.top)*(H/r.height);},{passive:false});
  cv.addEventListener('touchend',()=>isDown=false);

  // Initial burst
  [0,1,2,3].forEach(i=>setTimeout(()=>spawn(W/2+(Math.random()-.5)*200,H/3+(Math.random()-.5)*80,30,true),i*120));
  ctx.fillStyle='#020208'; ctx.fillRect(0,0,W,H);
  pLoop=requestAnimationFrame(loop);
}

/* ──────────────────────────────────────────────────────────────────
   TERMINAL DEMO
────────────────────────────────────────────────────────────────── */
function startTerminalDemo() {
  demoContent.innerHTML=`
    <p class="demo-title">JS Terminal</p>
    <p class="demo-sub">Live JavaScript REPL &nbsp;·&nbsp; Type any JS &nbsp;·&nbsp; ↑↓ history &nbsp;·&nbsp; Tab to autocomplete</p>
    <div class="demo-terminal-wrap">
      <div class="terminal-box">
        <div class="terminal-topbar">
          <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
          <span class="terminal-filename">truwty-repl.js</span>
        </div>
        <div class="terminal-output" id="termOut">
          <div class="term-welcome">// Truwty's JavaScript Terminal v2.0</div>
          <div class="term-hint-msg">// Try: help() · about() · skills() · matrix() · clear()</div>
        </div>
        <div class="terminal-input-row">
          <span class="term-in-prompt">›</span>
          <input id="termInput" type="text" autocomplete="off" spellcheck="false" placeholder="Type JavaScript here...">
        </div>
      </div>
      <div class="terminal-hint">💡 Try: Math.PI · [1,2,3].map(x=>x*2) · about() · skills()</div>
    </div>`;

  const out  = document.getElementById('termOut');
  const inp  = document.getElementById('termInput');
  let hist=[], hidx=-1;

  const cmds={
    help:()=>`Commands available:
  about()    — Who is Truwty
  skills()   — Tech breakdown
  contact()  — Contact info
  clear()    — Clear screen
  matrix()   — 🔴💊
  Any valid JS expression also works!`,
    about:()=>`{
  name:    "Truwty",
  role:    "Full Stack Developer",
  origin:  "Roblox → The Web",
  followers: 12000+,
  languages: ["Lua", "JS", "Python"],
  available: true
}`,
    skills:()=>`Stack:
  ▸ Lua         Expert    ████████████ 92%
  ▸ JavaScript  Advanced  ███████████  88%
  ▸ Python      Proficient██████████   80%

  + HTML/CSS · Node.js · React · Canvas API
    Git · REST APIs · WebSockets · SQL`,
    contact:()=>`Get in touch:
  ✉  truwty1@gmail.com
  💬 Discord: truwty`,
    clear:()=>{ out.innerHTML=`<div class="term-welcome">// Terminal cleared.</div>`; return null; },
    matrix:()=>{
      const c='アイウエオカキ01クケコ';
      return Array.from({length:8},()=>Array.from({length:28},()=>c[Math.floor(Math.random()*c.length)]).join(' ')).join('\n');
    }
  };

  function run(raw){
    const cmd=raw.trim(); if(!cmd) return;
    hist.unshift(cmd); if(hist.length>50)hist.pop(); hidx=-1;
    addLine(cmd, true);
    const fn=cmd.replace(/\(\s*\)$/,'').trim();
    if(cmds[fn]!==undefined){ const r=cmds[fn](); if(r!=null) addOut(r,false); return; }
    try {
      const logs=[]; const ol=console.log; const od=console.dir;
      console.log=(...a)=>logs.push(a.map(safe).join(' '));
      console.dir=(...a)=>logs.push(safe(a[0]));
      let res=(0,eval)(cmd);
      console.log=ol; console.dir=od;
      if(logs.length>0) logs.forEach(l=>addOut(l,false));
      else if(res!==undefined) addOut(safe(res),false);
      else addOut('undefined',false);
    } catch(e){ addOut('⚠ '+e.message, true); }
  }

  function addLine(txt, isCmd){
    const d=document.createElement('div'); d.className='term-line-out';
    d.innerHTML=`<span class="term-prompt-sym">›</span><span class="term-cmd-txt">${esc(txt)}</span>`;
    out.appendChild(d); scroll();
  }
  function addOut(txt,err){
    const d=document.createElement('div'); d.className=err?'term-err':'term-out';
    d.textContent=txt; out.appendChild(d); scroll();
  }
  function scroll(){ out.scrollTop=out.scrollHeight; }
  function safe(v){ if(v===null)return'null'; if(v===undefined)return'undefined'; if(typeof v==='string')return v; if(typeof v==='function')return v.toString().split('\n')[0]+'...}'; try{return JSON.stringify(v,null,2);}catch{return String(v);} }
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ run(inp.value); inp.value=''; }
    else if(e.key==='ArrowUp'){ e.preventDefault(); hidx=Math.min(hidx+1,hist.length-1); inp.value=hist[hidx]||''; }
    else if(e.key==='ArrowDown'){ e.preventDefault(); hidx=Math.max(hidx-1,-1); inp.value=hidx>=0?hist[hidx]:''; }
    else if(e.key==='Tab'){ e.preventDefault(); const v=inp.value; const m=Object.keys(cmds).find(k=>k.startsWith(v)); if(m)inp.value=m+'()'; }
  });
  out.addEventListener('click',()=>inp.focus());
  setTimeout(()=>inp.focus(), 100);
}

/* ═══════════════════════════════════════════════════════════════════
   WEBSITE SHOWCASE — iframe launcher
═══════════════════════════════════════════════════════════════════ */
const siteOverlay = document.getElementById('siteOverlay');
const siteFrame   = document.getElementById('siteFrame');
const siteTitle   = document.getElementById('siteModalTitle');
const siteClose   = document.getElementById('siteClose');

const siteMap = {
  band:   { file:'sites/band.html',  title:'Scratch Cat — Alt-Rock Band' },
  salon:  { file:'sites/salon.html', title:'Lumina — Hair Studio Website' },
  gym:    { file:'https://truwty.github.io/Unknowns-Quatermaster-Site/index.html', title:'Unknowns Quartermaster', external:true }
};

function openSite(key) {
  const s = siteMap[key]; if(!s) return;
  siteFrame.src = s.file;
  siteTitle.textContent = s.title;
  siteOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSite() {
  siteOverlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(()=>{ siteFrame.src=''; },400);
}

siteClose.addEventListener('click', closeSite);
siteOverlay.addEventListener('click', e=>{ if(e.target===siteOverlay) closeSite(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&siteOverlay.classList.contains('open')) closeSite(); });
