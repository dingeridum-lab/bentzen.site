import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   BENTZEN — script.js
   Full THREE.js scene + all interactions preserved from
   original ATELIER studio codebase, adapted for Bentzen
═══════════════════════════════════════════════════════ */

/* ═══════════════════════ GLOBALS ═══════════════════════ */
let scene, camera, renderer, clock;
let glassObjs = [], wireObjs = [], particles;
let scrollProg = 0, targetScroll = 0;
let mx = 0, my = 0, smx = 0, smy = 0;
let idle = false, idleTmr = null;
let curSec = 0, loaded = false;
const secs = document.querySelectorAll('.sec');
const N = Math.max(secs.length, 1);

/* Color temperatures per section — Bentzen brand palette */
const tCols = [
  '#c8956c','#d4a95c','#5c8fd4',
  '#c8956c','#8fd4a5','#d4915c',
  '#e8a54c','#5c8fd4','#c8956c'
].map(c => new THREE.Color(c));
const tNames = [
  'Home','Services','About',
  'Portfolio','Reviews','Blog',
  'FAQ','Contact','Legal'
];

/* ═══════════════════════ CURSOR ═══════════════════════ */
const cur = document.getElementById('cur');
const curD = document.getElementById('curDot');
let cx = 0, cy = 0, dx = 0, dy = 0;

document.addEventListener('mousemove', e => {
  cx = e.clientX; cy = e.clientY;
  mx = (e.clientX / innerWidth) * 2 - 1;
  my = -(e.clientY / innerHeight) * 2 + 1;
  clearTimeout(idleTmr); idle = false;
  idleTmr = setTimeout(() => { idle = true }, 2200);
});

/* Cursor trail */
const TC = 10, trs = [];
for (let i = 0; i < TC; i++) {
  const d = document.createElement('div');
  d.className = 'trail';
  document.body.appendChild(d);
  trs.push({ el: d, x: 0, y: 0 });
}

function updCur() {
  dx += (cx - dx) * .32; dy += (cy - dy) * .32;
  if (cur) { cur.style.left = dx - 11 + 'px'; cur.style.top = dy - 11 + 'px'; }
  if (curD) { curD.style.left = cx - 2 + 'px'; curD.style.top = cy - 2 + 'px'; }
  for (let i = 0; i < TC; i++) {
    const p = i === 0 ? { x: dx, y: dy } : trs[i - 1];
    trs[i].x += (p.x - trs[i].x) * (.28 - i * .025);
    trs[i].y += (p.y - trs[i].y) * (.28 - i * .025);
    trs[i].el.style.left = trs[i].x - 1.5 + 'px';
    trs[i].el.style.top = trs[i].y - 1.5 + 'px';
    trs[i].el.style.opacity = (1 - i / TC) * .22;
  }
}

document.querySelectorAll('a,button,.svc-card,.port-card,.review-card,.faq-q,.nav-link').forEach(el => {
  el.addEventListener('mouseenter', () => cur && cur.classList.add('active'));
  el.addEventListener('mouseleave', () => cur && cur.classList.remove('active'));
});

/* ═══════════════════════ LOADER ═══════════════════════ */
const lLine = document.getElementById('lLine');
const lPct = document.getElementById('lPct');
const loader = document.getElementById('loader');
const loaderCodeBg = document.getElementById('loaderCodeBg');

/* Animated code lines */
const codeSnippets = [
  'const bentzen = new Agency({ premium: true, quality: "unmatched" });',
  'import { Design, Code, Marketing } from "@bentzen/core";',
  'await buildApp({ platform: ["iOS","Android"], quality: 100 });',
  'const website = await develop({ tech: "Next.js", animation: "GSAP" });',
  'const campaign = new FacebookAds({ targeting: "precision", roas: 5 });',
  'function elevate(brand) { return premium(design(build(brand))); }',
  'const software = deploy({ cloud: "AWS", scale: "enterprise" });',
  'class BentzenProject extends PremiumSolution { constructor() {...} }',
  'const automation = whatsapp.connect({ leads: true, ai: true });',
  'await googleAds.optimize({ keywords: targetKeywords, bid: "smart" });',
  'export default function BuildDesignElevate() { return <Bentzen />; }',
  'const ugc = createContent({ authentic: true, conversion: "high" });',
  'app.use(middleware.premium()); // Bentzen quality middleware',
  'git commit -m "feat: delivered premium digital solution for client"',
  'npm run build:production // Bentzen Build System v2026',
  'const results = await analytics.track({ roi: "5x", satisfaction: 100 });',
  'SELECT * FROM clients WHERE satisfaction = 100 ORDER BY success DESC;',
  'docker build -t bentzen-app --build-arg QUALITY=premium .',
  '{ "agency": "Bentzen", "location": "Ahmedabad", "rating": "5/5" }',
  'return { build: true, design: true, elevate: true }; // Bentzen promise',
];

if (loaderCodeBg) {
  codeSnippets.forEach((line, i) => {
    const el = document.createElement('div');
    el.className = 'code-line';
    el.textContent = line;
    el.style.setProperty('--d', (1.5 + Math.random()) + 's');
    el.style.setProperty('--delay', (i * 0.12) + 's');
    loaderCodeBg.appendChild(el);
  });
}

let lp = 0;
const lInt = setInterval(() => {
  lp += Math.random() * 5 + 2;
  if (lp >= 100) {
    lp = 100;
    clearInterval(lInt);
    setTimeout(() => {
      loaded = true;
      if (loader) loader.classList.add('hidden');
      setTimeout(() => {
        const h0 = document.getElementById('h0');
        if (h0) h0.classList.add('vis');
        initCounters();
        initSlider();
      }, 350);
    }, 600);
  }
  if (lLine) lLine.style.width = lp + '%';
  if (lPct) lPct.textContent = String(Math.floor(lp)).padStart(3, '0');
}, 60);

/* ═══════════════════════ THREE.JS SCENE ═══════════════════════ */
function initScene() {
  const canvas = document.getElementById('scene-canvas');
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08080a, 0.028);

  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 0, 14);
  clock = new THREE.Clock();

  /* Environment map */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSc = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(25, 32, 32);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uC1: { value: new THREE.Color('#1a1208') },
      uC2: { value: new THREE.Color('#08080a') },
      uC3: { value: new THREE.Color('#c8956c') }
    },
    vertexShader: `varying vec3 vW;void main(){vW=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 uC1,uC2,uC3;varying vec3 vW;void main(){float y=normalize(vW).y;vec3 c=mix(uC2,uC1,smoothstep(-1.,0.,y));c=mix(c,uC3,smoothstep(.3,1.,y)*.3);gl_FragColor=vec4(c,1.);}`
  });
  envSc.add(new THREE.Mesh(envGeo, envMat));
  for (let i = 0; i < 6; i++) {
    const pl = new THREE.PointLight(0xffffff, 60, 35);
    pl.position.set(Math.sin(i * 1.1) * 10, Math.cos(i * .7) * 6 + 3, Math.sin(i * .4) * 10);
    envSc.add(pl);
  }
  const envMap = pmrem.fromScene(envSc, .04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  /* Glass shader — exact from original */
  const gVS = `varying vec3 vN,vV,vW;varying vec2 vUv;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*mv;}`;
  const gFS = `uniform vec3 uCol,uLC;uniform float uOp,uT,uFP,uRef;varying vec3 vN,vV,vW;varying vec2 vUv;
void main(){
  vec3 vd=normalize(vV),n=normalize(vN);
  float fr=pow(1.-abs(dot(vd,n)),uFP);
  vec3 rf=reflect(-vd,n);float er=rf.y*.5+.5;
  vec3 env=mix(vec3(.015),uLC,er*.7);
  float irA=dot(vd,n);
  vec3 iri=vec3(sin(irA*6.28+uT*.18)*.5+.5,sin(irA*6.28+uT*.18+2.09)*.5+.5,sin(irA*6.28+uT*.18+4.18)*.5+.5)*.18;
  vec3 rc=refract(-vd,n,uRef);
  float rp=sin(vW.x*12.+uT*.45)*cos(vW.y*12.+uT*.28)*.5+.5;
  vec3 col=uCol*.12+env*fr*.85+iri*fr+rp*uCol*.04;
  gl_FragColor=vec4(col,uOp+fr*.65);}`;

  function mkGlass(col, op = .18, fp = 3.2, ref = .92) {
    return new THREE.ShaderMaterial({
      vertexShader: gVS, fragmentShader: gFS,
      uniforms: {
        uCol: { value: new THREE.Color(col) }, uOp: { value: op }, uT: { value: 0 },
        uLC: { value: new THREE.Color('#c8956c') }, uFP: { value: fp }, uRef: { value: ref }
      },
      transparent: true, side: THREE.DoubleSide, depthWrite: false
    });
  }

  /* 3D Objects — Bentzen brand colors */
  const cfgs = [
    { g: new THREE.IcosahedronGeometry(2, 1), p: [3.5, .5, 9], c: '#c8956c', r: [.002, .003, .001] },
    { g: new THREE.OctahedronGeometry(.65, 0), p: [-2.5, 2.2, 11], c: '#d4a95c', r: [.003, .002, .004] },
    { g: new THREE.TetrahedronGeometry(.45, 0), p: [4.5, -1.8, 10], c: '#a0703f', r: [.004, .001, .003] },
    { g: new THREE.TorusKnotGeometry(1.3, .28, 90, 18, 2, 3), p: [4.5, .2, 6.5], c: '#d4a95c', r: [.001, .002, .001] },
    { g: new THREE.DodecahedronGeometry(.55, 0), p: [-1.5, 2.8, 7.5], c: '#c8956c', r: [.002, .003, .002] },
    { g: new THREE.TorusGeometry(1.6, .14, 36, 120), p: [-3.5, .3, 4], c: '#5c8fd4', r: [.002, .001, .003] },
    { g: new THREE.IcosahedronGeometry(.75, 0), p: [1.2, -2.2, 5.5], c: '#5ca5d4', r: [.003, .004, .001] },
    { g: new THREE.BoxGeometry(.85, .85, .85), p: [2.2, 1.8, 4.8], c: '#4c7fc4', r: [.001, .002, .004] },
    { g: new THREE.ConeGeometry(.85, 1.7, 6), p: [2.5, 1.2, 2.2], c: '#c8956c', r: [.003, .001, .002] },
    { g: new THREE.TorusKnotGeometry(.65, .18, 70, 14, 3, 2), p: [-2.5, -1.2, 3.2], c: '#d4915c', r: [.002, .003, .001] },
    { g: new THREE.CylinderGeometry(.25, .85, 2.2, 8), p: [3.5, -.5, .5], c: '#8fd4a5', r: [.001, .002, .001] },
    { g: new THREE.OctahedronGeometry(1.1, 0), p: [-1.2, 1.2, .2], c: '#a5d4b8', r: [.002, .001, .003] },
  ];

  cfgs.forEach((cfg, i) => {
    const mat = mkGlass(cfg.c);
    const mesh = new THREE.Mesh(cfg.g, mat);
    mesh.position.set(...cfg.p);
    mesh.userData = { bp: new THREE.Vector3(...cfg.p), rs: cfg.r, fo: Math.random() * Math.PI * 2, fs: .25 + Math.random() * .4, fa: .12 + Math.random() * .22, idx: i };
    scene.add(mesh); glassObjs.push(mesh);

    const wMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.c), wireframe: true, transparent: true, opacity: .04 });
    const wMesh = new THREE.Mesh(cfg.g, wMat);
    wMesh.position.copy(mesh.position);
    wMesh.scale.setScalar(1.01);
    wMesh.userData = mesh.userData;
    scene.add(wMesh); wireObjs.push(wMesh);
  });

  /* Particles */
  const PC = 2800, pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PC * 3), pSz = new Float32Array(PC), pAl = new Float32Array(PC);
  for (let i = 0; i < PC; i++) {
    pPos[i * 3] = (Math.random() - .5) * 35;
    pPos[i * 3 + 1] = (Math.random() - .5) * 22;
    pPos[i * 3 + 2] = (Math.random() - .5) * 25 - 3;
    pSz[i] = Math.random() * 3.5 + .4;
    pAl[i] = Math.random();
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSz, 1));
  pGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pAl, 1));
  const pMat = new THREE.ShaderMaterial({
    vertexShader: `attribute float aSize,aAlpha;varying float vA;uniform float uT;void main(){vA=aAlpha;vec3 p=position;p.y+=sin(uT*.08+position.x*.4)*.35;p.x+=cos(uT*.06+position.z*.25)*.25;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=aSize*(220./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying float vA;uniform vec3 uPC;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,.0,d)*vA*.32;gl_FragColor=vec4(uPC,a);}`,
    uniforms: { uT: { value: 0 }, uPC: { value: new THREE.Color('#c8956c') } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* Lights */
  scene.add(new THREE.AmbientLight(0x1a1208, .6));
  const mLight = new THREE.PointLight(0xc8956c, 35, 28);
  mLight.position.set(5, 5, 9); mLight.userData.main = true;
  scene.add(mLight);
  scene.add(new THREE.PointLight(0x334466, 12, 22));
  scene.add(new THREE.PointLight(0xffffff, 18, 22));
  window._ml = mLight;

  /* Camera path */
  const pp = [
    new THREE.Vector3(0, 0, 14),
    new THREE.Vector3(-4.5, 1.8, 10),
    new THREE.Vector3(3.5, -1.2, 7.5),
    new THREE.Vector3(-3.5, 2.2, 5.5),
    new THREE.Vector3(4.5, -.6, 3.5),
    new THREE.Vector3(0, .6, 2.5),
    new THREE.Vector3(-2, 1, 1.8),
    new THREE.Vector3(2, -.5, 1.2),
    new THREE.Vector3(0, 0, .8),
  ];
  const camPath = new THREE.CatmullRomCurve3(pp, false, 'catmullrom', .5);
  window._cp = camPath;

  /* Scroll */
  window.addEventListener('scroll', () => {
    const maxS = document.documentElement.scrollHeight - innerHeight;
    targetScroll = Math.max(0, Math.min(1, scrollY / maxS));
    const prog = document.getElementById('prog');
    if (prog) prog.style.width = (targetScroll * 100) + '%';

    const numCols = Math.min(tCols.length, N);
    const sp = targetScroll * (numCols - 1);
    const ci = Math.min(Math.floor(sp), numCols - 1);
    const fr = sp - ci;
    const ni = Math.min(ci + 1, numCols - 1);
    const cc = tCols[ci].clone().lerp(tCols[ni], fr);
    if (mLight) mLight.color.copy(cc);
    const hex = '#' + cc.getHexString();
    const gw1 = document.getElementById('gw1'), gw2 = document.getElementById('gw2');
    if (gw1) gw1.style.background = hex;
    if (gw2) gw2.style.background = hex;
    if (prog) prog.style.background = hex;
    glassObjs.forEach(o => { o.material.uniforms.uLC.value.copy(cc) });
    if (particles) particles.material.uniforms.uPC.value.copy(cc);
    const sInd = document.getElementById('sInd');
    if (sInd) sInd.classList.toggle('hide', targetScroll > .04);

    /* Active nav link */
    updateActiveNav();
  }, { passive: true });

  /* Resize */
  addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* IntersectionObserver for all reveal elements */
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { e.target.classList.toggle('vis', e.isIntersecting) });
  }, { threshold: .2 });
  document.querySelectorAll('.hero,.reveal-up,.reveal-left,.reveal-right').forEach(el => obs.observe(el));

  /* Double-click burst */
  let lastClk = 0;
  document.addEventListener('click', e => {
    const now = Date.now();
    if (now - lastClk < 320) burstAt(e.clientX, e.clientY);
    lastClk = now;
  });

  function burstAt(sx, sy) {
    const v = new THREE.Vector3((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1, .5).unproject(camera);
    const d = v.sub(camera.position).normalize();
    const wp = camera.position.clone().add(d.multiplyScalar(9));
    const BC = 60, bg = new THREE.BufferGeometry(), bp = new Float32Array(BC * 3), bv = [];
    for (let i = 0; i < BC; i++) {
      bp[i * 3] = wp.x; bp[i * 3 + 1] = wp.y; bp[i * 3 + 2] = wp.z;
      bv.push(new THREE.Vector3((Math.random() - .5) * .12, (Math.random() - .5) * .12, (Math.random() - .5) * .12));
    }
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    const bm = new THREE.PointsMaterial({ color: tCols[Math.min(curSec, tCols.length - 1)], size: .07, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const b = new THREE.Points(bg, bm); scene.add(b);
    let life = 1;
    (function anim() {
      life -= .018;
      if (life <= 0) { scene.remove(b); bg.dispose(); bm.dispose(); return; }
      const a = bg.attributes.position.array;
      for (let i = 0; i < BC; i++) {
        a[i * 3] += bv[i].x; a[i * 3 + 1] += bv[i].y; a[i * 3 + 2] += bv[i].z;
        bv[i].multiplyScalar(.955);
      }
      bg.attributes.position.needsUpdate = true;
      bm.opacity = life;
      requestAnimationFrame(anim);
    })();
  }
}

/* ═══════════════════════ ANIMATION LOOP ═══════════════════════ */
function loop() {
  requestAnimationFrame(loop);
  if (!clock || !renderer) return;
  const t = clock.getElapsedTime();
  scrollProg += (targetScroll - scrollProg) * .055;
  smx += (mx - smx) * .045; smy += (my - smy) * .045;

  /* Camera movement along path */
  if (window._cp) {
    const clen = Math.min(tCols.length, N);
    const pt = window._cp.getPointAt(Math.max(0, Math.min(1, scrollProg)));
    const lk = window._cp.getPointAt(Math.max(0, Math.min(1, scrollProg + .04)));
    const px = idle ? smx * .55 : smx * .14;
    const py = idle ? smy * .4 : smy * .1;
    camera.position.set(pt.x + px, pt.y + py, pt.z);
    camera.lookAt(lk.x + px * .4, lk.y + py * .4, lk.z);
  }

  /* Animate glass objects */
  glassObjs.forEach((o, i) => {
    const u = o.userData;
    o.rotation.x += u.rs[0]; o.rotation.y += u.rs[1]; o.rotation.z += u.rs[2];
    o.position.y = u.bp.y + Math.sin(t * u.fs + u.fo) * u.fa;
    o.position.x = u.bp.x + Math.cos(t * u.fs * .7 + u.fo) * u.fa * .5;
    o.material.uniforms.uT.value = t;
    const d = camera.position.distanceTo(o.position);
    const sc = d < 5.5 ? 1.12 : 1;
    o.scale.setScalar(o.scale.x + (sc - o.scale.x) * .04);
    if (wireObjs[i]) {
      wireObjs[i].position.copy(o.position);
      wireObjs[i].rotation.copy(o.rotation);
      wireObjs[i].scale.copy(o.scale).multiplyScalar(1.012);
    }
  });

  /* Particles */
  if (particles) {
    particles.material.uniforms.uT.value = t;
    particles.rotation.y = t * .008;
  }

  /* Main light follows camera */
  if (window._ml) window._ml.position.set(camera.position.x + 3.5, camera.position.y + 4.5, camera.position.z + 2.5);

  /* Section index */
  const sp2 = scrollProg * (N - 1);
  curSec = Math.min(Math.floor(sp2), N - 1);

  updCur();
  renderer.render(scene, camera);
}

/* ═══════════════════════ HERO SLIDER ═══════════════════════ */
let sliderIdx = 0;
function initSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.getElementById('sliderDots');
  if (!slides.length) return;

  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goSlide(i);
    if (dotsWrap) dotsWrap.appendChild(dot);
  });

  setInterval(() => { goSlide((sliderIdx + 1) % slides.length); }, 3000);

  function goSlide(idx) {
    slides[sliderIdx].classList.remove('active');
    const dots = document.querySelectorAll('.slider-dot');
    if (dots[sliderIdx]) dots[sliderIdx].classList.remove('active');
    sliderIdx = idx;
    slides[sliderIdx].classList.add('active');
    if (dots[sliderIdx]) dots[sliderIdx].classList.add('active');
  }
}

/* ═══════════════════════ COUNTER ANIMATION ═══════════════════════ */
function initCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.getAttribute('data-target')) || 0;
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current);
    }, 25);
  });
}

/* ═══════════════════════ NAV ═══════════════════════ */
function updateActiveNav() {
  const sections = document.querySelectorAll('.sec[id]');
  let activeId = '';
  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= innerHeight / 2 && rect.bottom >= innerHeight / 2) {
      activeId = sec.id;
    }
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + activeId);
  });
}

/* Nav hide on scroll down */
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  if (scrollY > lastScrollY && scrollY > 100) nav.classList.add('hidden');
  else nav.classList.remove('hidden');
  lastScrollY = scrollY;
}, { passive: true });

/* Mobile burger */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('.mobile-link, .mobile-cta').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

/* Smooth anchor scrolling */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ═══════════════════════ SERVICE MODAL ═══════════════════════ */
const serviceData = {
  'app-dev': {
    icon: 'fas fa-mobile-screen-button',
    title: 'App Development',
    body: `
      <p>Bentzen crafts high-performance, visually stunning mobile applications for iOS and Android platforms. Our app development process combines cutting-edge technology with human-centered design principles to create apps that users love.</p>
      <h4>Our Capabilities</h4>
      <ul>
        <li>Native iOS development (Swift, SwiftUI)</li>
        <li>Native Android development (Kotlin, Jetpack Compose)</li>
        <li>Cross-platform development (React Native, Flutter)</li>
        <li>Progressive Web Apps (PWA)</li>
        <li>App Store Optimization (ASO)</li>
        <li>Backend API development & integration</li>
        <li>Real-time features (chat, notifications, live data)</li>
        <li>AR/VR integration</li>
        <li>Payment gateway integration</li>
      </ul>
      <h4>Our Process</h4>
      <p>We follow an agile development methodology: Discovery → Wireframing → UI/UX Design → Development → QA Testing → Launch → Post-launch Support. Every app is built with scalability, security, and performance in mind.</p>
      <h4>Deliverables</h4>
      <p>Source code, App Store/Play Store submission, technical documentation, 3 months of complimentary post-launch support.</p>
    `
  },
  'web-dev': {
    icon: 'fas fa-globe',
    title: 'Website Development',
    body: `
      <p>From elegant landing pages to complex web platforms, Bentzen delivers premium websites that perform, convert, and impress. We leverage the latest web technologies to build fast, responsive, and visually exceptional digital experiences.</p>
      <h4>Technologies We Use</h4>
      <ul>
        <li>React, Next.js, Vue.js, Nuxt.js</li>
        <li>Three.js, WebGL, GSAP animations</li>
        <li>WordPress, Shopify, Webflow</li>
        <li>Node.js, Python, PHP backends</li>
        <li>PostgreSQL, MongoDB, Firebase</li>
        <li>AWS, Vercel, Netlify deployment</li>
      </ul>
      <h4>Key Features</h4>
      <p>Every website we build is: Lightning fast (Core Web Vitals optimized), fully responsive (mobile-first), SEO-ready, accessible (WCAG compliant), secure (SSL, DDoS protection), and CMS-powered for easy content management.</p>
      <h4>Types of Projects</h4>
      <p>Corporate websites, e-commerce stores, SaaS platforms, portfolios, booking systems, real estate portals, educational platforms, and custom web applications.</p>
    `
  },
  'software-dev': {
    icon: 'fas fa-code-branch',
    title: 'Custom Software Development',
    body: `
      <p>When off-the-shelf solutions don't cut it, Bentzen engineers bespoke software tailored precisely to your business processes. Our custom software solutions are built for scale, security, and long-term maintainability.</p>
      <h4>What We Build</h4>
      <ul>
        <li>Enterprise Resource Planning (ERP) systems</li>
        <li>Customer Relationship Management (CRM)</li>
        <li>Inventory and supply chain management</li>
        <li>HR and payroll management systems</li>
        <li>Business intelligence & analytics dashboards</li>
        <li>SaaS products and multi-tenant platforms</li>
        <li>API development and system integrations</li>
        <li>Workflow automation and process digitization</li>
      </ul>
      <h4>Technology Stack</h4>
      <p>We select the best technology for your specific use case: Python, Java, Node.js, .NET, Go for backend; React, Angular, Vue for frontend; AWS, Azure, GCP for cloud infrastructure; Docker & Kubernetes for containerization.</p>
    `
  },
  'fb-ads': {
    icon: 'fab fa-facebook-f',
    title: 'Facebook Ads',
    body: `
      <p>Bentzen's Facebook & Meta advertising service delivers precision-targeted campaigns that maximize reach, engagement, and return on ad spend. We combine data science with creative excellence to drive measurable business results.</p>
      <h4>Our Services Include</h4>
      <ul>
        <li>Facebook & Instagram campaign strategy</li>
        <li>Audience research and persona development</li>
        <li>Custom audience and lookalike audience creation</li>
        <li>Ad creative design (images, videos, carousels)</li>
        <li>Conversion-optimized copywriting</li>
        <li>A/B testing and creative iteration</li>
        <li>Pixel setup and event tracking</li>
        <li>Retargeting campaign management</li>
        <li>Monthly performance reporting</li>
      </ul>
      <h4>Average Results</h4>
      <p>Our clients typically see 3-7x ROAS, 40-60% reduction in cost per acquisition, and 2-4x increase in qualified leads within the first 90 days of campaign management.</p>
    `
  },
  'google-ads': {
    icon: 'fab fa-google',
    title: 'Google Ads',
    body: `
      <p>Dominate Google search results and reach your ideal customers at the exact moment they're searching for your products or services. Bentzen's Google Ads management is data-driven, ROI-focused, and continuously optimized.</p>
      <h4>Campaign Types We Manage</h4>
      <ul>
        <li>Search Ads (keyword-targeted text ads)</li>
        <li>Display Ads (visual banner campaigns)</li>
        <li>Shopping Ads (e-commerce product listings)</li>
        <li>YouTube Video Ads</li>
        <li>Performance Max campaigns</li>
        <li>Remarketing & RLSA campaigns</li>
        <li>Local Service Ads</li>
      </ul>
      <h4>Our Process</h4>
      <p>Keyword research → Competitor analysis → Campaign structure → Ad copywriting → Landing page optimization → Bid management → Conversion tracking → Ongoing optimization → Monthly reporting with full transparency.</p>
    `
  },
  'ig-ads': {
    icon: 'fab fa-instagram',
    title: 'Instagram Ads',
    body: `
      <p>Instagram is the premier platform for visual brands. Bentzen creates scroll-stopping Instagram ad campaigns that capture attention, build brand equity, and drive high-intent traffic to your business.</p>
      <h4>Ad Formats We Excel In</h4>
      <ul>
        <li>Feed ads (single image and carousel)</li>
        <li>Reels ads (short-form video)</li>
        <li>Stories ads (full-screen immersive)</li>
        <li>Explore ads</li>
        <li>Shopping ads (tagged products)</li>
        <li>Influencer partnership coordination</li>
      </ul>
      <h4>Creative Excellence</h4>
      <p>Our in-house creative team produces visually stunning ad content that aligns with your brand identity while being optimized for Instagram's algorithm. We test multiple creatives simultaneously to identify top performers and scale winning ads aggressively.</p>
    `
  },
  'whatsapp-auto': {
    icon: 'fab fa-whatsapp',
    title: 'WhatsApp Automation',
    body: `
      <p>Transform WhatsApp into a powerful business tool with Bentzen's intelligent automation solutions. From AI-powered chatbots to CRM integrations, we help you engage customers, qualify leads, and drive sales 24/7.</p>
      <h4>What We Build</h4>
      <ul>
        <li>AI-powered WhatsApp chatbots</li>
        <li>Automated lead capture and qualification</li>
        <li>Broadcast message campaigns</li>
        <li>WhatsApp Business API setup</li>
        <li>CRM integration (HubSpot, Salesforce, Zoho)</li>
        <li>Automated follow-up sequences</li>
        <li>Order tracking and customer support automation</li>
        <li>Multi-agent inbox management</li>
        <li>Analytics and conversation insights</li>
      </ul>
      <h4>Business Impact</h4>
      <p>Clients using our WhatsApp automation see 10x faster response times, 60% reduction in support costs, and 35% higher lead conversion rates through personalized, automated nurturing sequences.</p>
    `
  },
  'ugc-ads': {
    icon: 'fas fa-video',
    title: 'UGC Ads',
    body: `
      <p>User-Generated Content ads are the most authentic and high-performing ad format in 2026. Bentzen's UGC ad service produces genuine, relatable content that builds trust and drives conversion at scale.</p>
      <h4>Our UGC Production Process</h4>
      <ul>
        <li>Creator sourcing and selection (matched to your brand)</li>
        <li>Creative brief development</li>
        <li>Script writing and direction</li>
        <li>Content review and quality assurance</li>
        <li>Post-production editing and optimization</li>
        <li>Platform-specific formatting (Reels, TikTok, YouTube Shorts)</li>
        <li>A/B testing with multiple variations</li>
        <li>Performance tracking and iteration</li>
      </ul>
      <h4>Why UGC Works</h4>
      <p>UGC ads typically achieve 4x higher click-through rates, 50% lower CPM, and 2-3x higher conversion rates compared to traditional branded content. Authenticity sells — and we deliver it at scale.</p>
    `
  }
};

window.openModal = function(serviceId) {
  const data = serviceData[serviceId];
  if (!data) return;
  document.getElementById('modalIcon').innerHTML = `<i class="${data.icon}"></i>`;
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalBody').innerHTML = data.body;
  document.getElementById('svcModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
  document.getElementById('svcModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

/* ═══════════════════════ BLOG MODALS ═══════════════════════ */
const blogArticles = {
  1: {
    content: `
      <div class="blog-meta-lg">
        <span><i class="fas fa-calendar"></i> July 2026</span>
        <span><i class="fas fa-clock"></i> 8 min read</span>
        <span><i class="fas fa-tag"></i> Digital Strategy</span>
      </div>
      <h1>Why Every Business Needs a Comprehensive Digital Strategy in 2026</h1>
      <p>In today's hyper-connected world, having a digital presence isn't optional — it's survival. But a presence alone is not enough. What separates thriving businesses from struggling ones is a cohesive, data-driven digital strategy that aligns technology, marketing, and brand identity toward a common growth objective.</p>
      <h3>The Digital Landscape in 2026</h3>
      <p>Consumer behavior has fundamentally shifted. More than 85% of purchasing decisions now begin with an online search or social media discovery. Mobile usage accounts for over 70% of web traffic. AI-powered personalization has raised the bar for user experience expectations. In this environment, businesses that lack a unified digital strategy are essentially invisible to their most valuable potential customers.</p>
      <h3>What a Real Digital Strategy Looks Like</h3>
      <p>A comprehensive digital strategy isn't just about having a website and running some ads. It encompasses: a professionally developed, high-performance website; a cohesive mobile app strategy; data-driven advertising across the right platforms; marketing automation and CRM integration; content marketing and SEO; and real-time analytics that inform continuous optimization.</p>
      <h3>The ROI of Strategic Digital Investment</h3>
      <p>Businesses that invest in a comprehensive digital strategy see, on average, 3-5x higher revenue growth compared to those that approach digital marketing in an ad-hoc manner. The compounding effect of integrated digital touchpoints — where your website, app, advertising, and automation work in concert — creates a customer acquisition engine that becomes more efficient and powerful over time.</p>
      <h3>Where to Start</h3>
      <p>Begin with an honest audit of your current digital presence. Identify gaps between where you are and where your customers are. Prioritize the channels and tools that align with your business model and customer journey. Then, work with a trusted digital partner — like Bentzen — to execute with precision and measure everything.</p>
      <p>The brands that win in 2026 are those that treat digital not as a department, but as the core infrastructure of their entire business. The time to build that infrastructure is now.</p>
    `
  },
  2: {
    content: `
      <div class="blog-meta-lg">
        <span><i class="fas fa-calendar"></i> June 2026</span>
        <span><i class="fas fa-clock"></i> 6 min read</span>
        <span><i class="fas fa-tag"></i> App Development</span>
      </div>
      <h1>Cross-Platform vs Native: Choosing the Right Mobile Strategy</h1>
      <p>The debate between cross-platform and native app development continues to evolve as frameworks mature and business needs diversify. Making the wrong choice can cost you months of rework and thousands in unnecessary development costs.</p>
      <h3>Native Development: Maximum Performance</h3>
      <p>Native apps — built specifically for iOS (Swift) or Android (Kotlin) — deliver the highest performance, best user experience, and deepest device integration. If your app requires complex animations, high-performance graphics, AR features, or intensive background processing, native is the right choice. The trade-off is separate codebases for each platform, meaning higher development costs and longer timelines.</p>
      <h3>Cross-Platform: Speed and Efficiency</h3>
      <p>Frameworks like React Native and Flutter have matured dramatically. Flutter, in particular, now delivers near-native performance with a single codebase that runs on iOS, Android, web, and desktop. For most business applications — e-commerce apps, booking systems, dashboards, and marketplace apps — cross-platform development delivers 90% of native performance at 60% of the cost.</p>
      <h3>Bentzen's Recommendation</h3>
      <p>We assess each project individually. For consumer-facing apps where experience is a differentiator, we often recommend native or Flutter. For internal business tools and MVP launches, React Native or Flutter provides excellent ROI. The right answer depends on your users, your timeline, and your budget — and we'll guide you to the optimal choice.</p>
    `
  },
  3: {
    content: `
      <div class="blog-meta-lg">
        <span><i class="fas fa-calendar"></i> May 2026</span>
        <span><i class="fas fa-clock"></i> 5 min read</span>
        <span><i class="fas fa-tag"></i> Advertising</span>
      </div>
      <h1>Maximizing ROAS: Advanced Meta Ads Strategies for 2026</h1>
      <p>Return on Ad Spend is the ultimate KPI for any paid campaign. With Meta's advertising platform becoming increasingly competitive, the difference between mediocre and exceptional ROAS lies in strategic sophistication, creative quality, and continuous optimization.</p>
      <h3>The Creative is Now the Targeting</h3>
      <p>With Meta's AI-powered delivery system (Advantage+), the algorithm has become remarkably good at finding the right audience for the right creative. This means that in 2026, creative quality is more important than ever. A compelling video ad will find its audience — Meta's machine learning will ensure that. Your job is to produce multiple high-quality creative variants and let the algorithm identify winners.</p>
      <h3>Funnel Architecture That Works</h3>
      <p>Top of funnel: broad audience video views or engagement campaigns to build brand awareness at low CPM. Middle of funnel: retargeting with social proof, testimonials, and benefit-focused content to warm audiences. Bottom of funnel: conversion-optimized ads with strong CTAs, limited time offers, and frictionless checkout experiences. Each stage requires different messaging and creative approaches.</p>
      <h3>Bentzen's Proven Framework</h3>
      <p>Our campaigns consistently achieve 3-7x ROAS through rigorous creative testing (minimum 5 variations per ad set), audience segmentation, conversion rate optimization of landing pages, and weekly performance reviews with data-driven adjustments. The key is treating paid advertising as a scientific discipline — hypothesize, test, measure, iterate.</p>
    `
  }
};

window.openBlogModal = function() { openBlog(1); };
window.openBlogModal2 = function() { openBlog(2); };
window.openBlogModal3 = function() { openBlog(3); };

function openBlog(id) {
  const data = blogArticles[id];
  if (!data) return;
  document.getElementById('blogModalContent').innerHTML = data.content;
  document.getElementById('blogModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.closeBlogModal = function() {
  document.getElementById('blogModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

/* ═══════════════════════ FAQ ═══════════════════════ */
window.toggleFaq = function(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};

/* ═══════════════════════ PORTFOLIO ═══════════════════════ */
window.openPortfolio = function(url) { window.open(url, '_blank'); };
window.downloadPortfolio = function(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.target = '_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

/* ═══════════════════════ MAP ═══════════════════════ */
window.openMap = function() {
  window.open('https://www.google.com/maps/search/Ahmedabad+Gujarat+India', '_blank');
};

/* ═══════════════════════ CONTACT FORM ═══════════════════════ */
window.submitForm = function(e) {
  e.preventDefault();
  const form = e.target;
  const formStatus = document.getElementById('formStatus');
  const submitBtn = form.querySelector('.form-submit');
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  const data = new FormData(form);
  const name = data.get('name');
  const email = data.get('email');
  const phone = data.get('phone') || 'Not provided';
  const service = data.get('service');
  const message = data.get('message');

  /* EmailJS or Formspree — using Formspree as universal solution */
  fetch('https://formspree.io/f/xpwzgkpq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ name, email, phone, service, message, _replyto: email, _subject: `Bentzen Inquiry from ${name} — ${service}` })
  })
  .then(res => {
    if (res.ok) {
      formStatus.className = 'form-status success';
      formStatus.textContent = '✓ Message sent! We\'ll get back to you within 24 hours.';
      form.reset();
    } else {
      throw new Error('Form submission failed');
    }
  })
  .catch(() => {
    /* Fallback: mailto */
    const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nMessage:\n${message}`;
    window.location.href = `mailto:Buildwithbentzen1@gmail.com?subject=Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
    formStatus.className = 'form-status success';
    formStatus.textContent = '✓ Opening your email client to send the message.';
  })
  .finally(() => {
    submitBtn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
    submitBtn.disabled = false;
  });
};

/* ═══════════════════════ CHATBOT ═══════════════════════ */
const chatbotKnowledge = {
  greetings: ['hello','hi','hey','good morning','good afternoon','good evening','namaste'],
  services: ['services','offer','provide','what do you do','capabilities'],
  pricing: ['price','cost','how much','budget','quote','rates'],
  contact: ['contact','reach','call','email','whatsapp','phone'],
  app: ['app','mobile','ios','android','flutter','react native'],
  website: ['website','web','site','landing page','development'],
  software: ['software','erp','crm','custom','enterprise'],
  facebook: ['facebook','meta','fb ads','social media ads'],
  google: ['google','adwords','ppc','search ads'],
  instagram: ['instagram','ig','reels','stories'],
  whatsapp: ['whatsapp','automation','chatbot','wa'],
  ugc: ['ugc','user generated','content','video ads'],
  portfolio: ['portfolio','work','projects','case study'],
  location: ['location','where','ahmedabad','india','address'],
  timeline: ['timeline','how long','time','days','weeks'],
};

const botResponses = {
  default: [
    "Thanks for reaching out to Bentzen! I'm here to help. We specialize in App Development, Web Development, Custom Software, and Digital Advertising. What would you like to know?",
    "Great question! Let me help you. Bentzen offers premium digital solutions including app development, websites, software, and performance marketing. How can I assist you today?",
    "I'd be happy to help! You can also reach our team directly at +91 99980 26204 or Buildwithbentzen1@gmail.com. What would you like to know about our services?"
  ],
  services: "Bentzen offers 8 premium services:\n\n📱 App Development (iOS & Android)\n🌐 Website Development\n💻 Custom Software\n📘 Facebook Ads\n🔍 Google Ads\n📸 Instagram Ads\n💬 WhatsApp Automation\n🎬 UGC Ads\n\nWhich service interests you most?",
  pricing: "Our pricing is tailored to each project's scope and requirements. We offer competitive pricing for premium quality. To get an accurate quote:\n\n• Fill out our contact form\n• WhatsApp us: +91 99980 26204\n• Email: Buildwithbentzen1@gmail.com\n\nWe typically respond within 2-4 hours! 🚀",
  contact: "You can reach Bentzen through:\n\n📞 +91 99980 26204\n📞 +91 97253 14629\n📧 Buildwithbentzen1@gmail.com\n💬 WhatsApp: +91 99980 26204\n📍 Ahmedabad, Gujarat, India\n\nWe're available Monday-Saturday, 9AM-7PM IST.",
  app: "Our App Development team builds:\n\n• Native iOS (Swift/SwiftUI)\n• Native Android (Kotlin)\n• Cross-platform (React Native, Flutter)\n• Progressive Web Apps\n\nAverage timeline: 4-12 weeks. Ready to discuss your app idea? 📱",
  website: "We build stunning, high-performance websites using:\n\n• React, Next.js, Vue.js\n• WordPress, Shopify\n• Custom web applications\n• E-commerce platforms\n\nAll sites are mobile-first, SEO-optimized, and lightning fast! 🌐",
  software: "Our custom software solutions include:\n\n• ERP & CRM systems\n• Inventory management\n• Business automation\n• SaaS platforms\n• API development\n\nWe build exactly what your business needs. 💻",
  facebook: "Our Facebook/Meta Ads service delivers:\n\n• Strategic campaign planning\n• Precision audience targeting\n• Creative ad design\n• A/B testing\n• Retargeting campaigns\n• Average 3-7x ROAS 📈",
  google: "Our Google Ads management covers:\n\n• Search, Display & Shopping ads\n• YouTube video campaigns\n• Performance Max\n• Remarketing\n• Full conversion tracking\n\nWe make every rupee count! 🔍",
  instagram: "Instagram Ads by Bentzen:\n\n• Feed, Reels & Stories ads\n• Visual creative production\n• Influencer coordination\n• Shopping integration\n• High-engagement campaigns 📸",
  whatsapp: "WhatsApp Automation by Bentzen:\n\n• AI-powered chatbots\n• Lead capture automation\n• Broadcast campaigns\n• CRM integration\n• 24/7 customer engagement\n\n10x faster response times! 💬",
  ugc: "Our UGC Ads service:\n\n• Creator sourcing & management\n• Script writing & direction\n• Professional editing\n• Platform optimization\n• 4x higher CTR than regular ads 🎬",
  portfolio: "Check out our Portfolio section to see our work! We've delivered:\n\n• Premium mobile apps\n• Enterprise SaaS platforms\n• High-ROAS ad campaigns\n• WhatsApp automation systems\n\nAll case studies available for download! 📁",
  location: "Bentzen is headquartered in:\n\n📍 Ahmedabad, Gujarat, India\n\nWe work with clients across India and internationally. Our remote-first workflow means seamless collaboration regardless of location! 🌍",
  timeline: "Project timelines at Bentzen:\n\n• Website: 2-4 weeks\n• Mobile App: 4-12 weeks\n• Custom Software: 6-16 weeks\n• Ad Campaigns: Live in 5-7 days\n\nWe always provide detailed timelines during the discovery phase.",
  greeting: "Hello! 👋 Welcome to Bentzen — Build. Design. Elevate.\n\nI'm your Bentzen Assistant, here to help you explore our premium digital services. What brings you here today?\n\nYou can ask me about:\n• Our services & capabilities\n• Pricing & timelines\n• How to get started\n• Contact information"
};

let chatbotOpen = false;
let chatbotStarted = false;
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotBadge = document.getElementById('chatbotBadge');

function addMessage(text, type) {
  if (!chatbotMessages) return;
  const msg = document.createElement('div');
  msg.className = `chatbot-msg ${type}`;
  msg.innerHTML = text.replace(/\n/g, '<br>');
  chatbotMessages.appendChild(msg);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function addTyping() {
  if (!chatbotMessages) return;
  const typing = document.createElement('div');
  typing.className = 'chatbot-typing';
  typing.id = 'botTyping';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatbotMessages.appendChild(typing);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('botTyping');
  if (t) t.remove();
}

function botReply(text) {
  addTyping();
  setTimeout(() => {
    removeTyping();
    addMessage(text, 'bot');
    showSuggestions();
  }, 800 + Math.random() * 600);
}

function showSuggestions() {
  const suggestions = document.getElementById('chatbotSuggestions');
  if (!suggestions) return;
  const items = ['Our Services', 'Get Pricing', 'App Development', 'Contact Us', 'Timeline'];
  suggestions.innerHTML = items.map(s =>
    `<span class="chat-suggestion" onclick="handleSuggestion('${s}')">${s}</span>`
  ).join('');
}

window.handleSuggestion = function(text) {
  addMessage(text, 'user');
  document.getElementById('chatbotSuggestions').innerHTML = '';
  processInput(text.toLowerCase());
};

function processInput(text) {
  const lower = text.toLowerCase();

  if (chatbotKnowledge.greetings.some(g => lower.includes(g))) {
    botReply(botResponses.greeting); return;
  }
  if (chatbotKnowledge.services.some(s => lower.includes(s))) { botReply(botResponses.services); return; }
  if (chatbotKnowledge.pricing.some(s => lower.includes(s))) { botReply(botResponses.pricing); return; }
  if (chatbotKnowledge.contact.some(s => lower.includes(s))) { botReply(botResponses.contact); return; }
  if (chatbotKnowledge.app.some(s => lower.includes(s))) { botReply(botResponses.app); return; }
  if (chatbotKnowledge.website.some(s => lower.includes(s))) { botReply(botResponses.website); return; }
  if (chatbotKnowledge.software.some(s => lower.includes(s))) { botReply(botResponses.software); return; }
  if (chatbotKnowledge.facebook.some(s => lower.includes(s))) { botReply(botResponses.facebook); return; }
  if (chatbotKnowledge.google.some(s => lower.includes(s))) { botReply(botResponses.google); return; }
  if (chatbotKnowledge.instagram.some(s => lower.includes(s))) { botReply(botResponses.instagram); return; }
  if (chatbotKnowledge.whatsapp.some(s => lower.includes(s))) { botReply(botResponses.whatsapp); return; }
  if (chatbotKnowledge.ugc.some(s => lower.includes(s))) { botReply(botResponses.ugc); return; }
  if (chatbotKnowledge.portfolio.some(s => lower.includes(s))) { botReply(botResponses.portfolio); return; }
  if (chatbotKnowledge.location.some(s => lower.includes(s))) { botReply(botResponses.location); return; }
  if (chatbotKnowledge.timeline.some(s => lower.includes(s))) { botReply(botResponses.timeline); return; }

  const defaults = botResponses.default;
  botReply(defaults[Math.floor(Math.random() * defaults.length)]);
}

window.toggleChatbot = function() {
  chatbotOpen = !chatbotOpen;
  if (chatbotWindow) chatbotWindow.classList.toggle('open', chatbotOpen);
  const chatIcon = document.getElementById('chatIcon');
  const chatClose = document.getElementById('chatClose');
  if (chatIcon) chatIcon.style.display = chatbotOpen ? 'none' : 'block';
  if (chatClose) chatClose.style.display = chatbotOpen ? 'block' : 'none';
  if (chatbotBadge) chatbotBadge.style.display = 'none';

  if (!chatbotStarted && chatbotOpen) {
    chatbotStarted = true;
    setTimeout(() => {
      botReply(botResponses.greeting);
    }, 500);
  }
};

window.sendChatMsg = function() {
  const input = document.getElementById('chatbotInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  const suggestions = document.getElementById('chatbotSuggestions');
  if (suggestions) suggestions.innerHTML = '';
  processInput(text);
};

/* Auto-start chatbot after delay */
setTimeout(() => {
  if (!chatbotOpen && chatbotBadge) {
    chatbotBadge.style.display = 'flex';
  }
}, 5000);

/* ═══════════════════════ INIT ═══════════════════════ */
initScene();
loop();
/* ═══════════════════════════════════════════════════════
   BENTZEN — admin.js
   Enterprise Admin Panel — Full Feature Set
═══════════════════════════════════════════════════════ */

/* ── State Management (localStorage for persistence) ── */
const STORE_KEY = 'bentzen_admin_v1';

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultStore();
  } catch(e) { return defaultStore(); }
}

function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  dispatchLiveUpdate(data);
}

function defaultStore() {
  return {
    analytics: {
      visitors: 1240, sessions: 1890, pageviews: 5430,
      formSubmissions: 34, chatbotInteractions: 127,
      downloads: 48, adImpressions: 9800,
      devices: { mobile: 58, desktop: 35, tablet: 7 },
      countries: [['India','72%'],['UAE','8%'],['USA','6%'],['UK','4%'],['Other','10%']],
      browsers: [['Chrome','64%'],['Safari','22%'],['Firefox','8%'],['Edge','6%']],
      popularPages: [['Home','42%'],['Services','28%'],['Contact','15%'],['Portfolio','10%'],['Blog','5%']],
      popularServices: [['Website Dev','35%'],['App Dev','28%'],['Google Ads','18%'],['Facebook Ads','12%'],['Other','7%']],
      recentActivity: [
        { time: '2 min ago', event: 'Form submission', detail: 'Website Dev inquiry from Mumbai' },
        { time: '8 min ago', event: 'Chatbot interaction', detail: 'User asked about app pricing' },
        { time: '15 min ago', event: 'Portfolio download', detail: 'Portfolio-02.pdf downloaded' },
        { time: '23 min ago', event: 'New visitor', detail: 'Visitor from Surat via Google' },
        { time: '1 hr ago', event: 'Form submission', detail: 'Facebook Ads inquiry' },
      ]
    },
    services: [
      { id:'app-dev', name:'App Development', icon:'fas fa-mobile-screen-button', active:true, order:1 },
      { id:'web-dev', name:'Website Development', icon:'fas fa-globe', active:true, order:2 },
      { id:'software-dev', name:'Custom Software', icon:'fas fa-code-branch', active:true, order:3 },
      { id:'fb-ads', name:'Facebook Ads', icon:'fab fa-facebook-f', active:true, order:4 },
      { id:'google-ads', name:'Google Ads', icon:'fab fa-google', active:true, order:5 },
      { id:'ig-ads', name:'Instagram Ads', icon:'fab fa-instagram', active:true, order:6 },
      { id:'whatsapp-auto', name:'WhatsApp Automation', icon:'fab fa-whatsapp', active:true, order:7 },
      { id:'ugc-ads', name:'UGC Ads', icon:'fas fa-video', active:true, order:8 },
    ],
    reviews: [
      { id:1, company:'Technozone Computer Class', industry:'Education Technology', stars:5, text:'Bentzen completely transformed our online presence. Their attention to detail, technical expertise, and commitment to quality is unmatched.', active:true },
      { id:2, company:'Adinath Equipments Pvt. Ltd.', industry:'Industrial Equipment', stars:4, text:'Exceptional work on our industrial equipment website. The team understood our B2B requirements perfectly.', active:true },
      { id:3, company:'Divya Estate Management', industry:'Real Estate', stars:5, text:'Working with Bentzen was a game-changer for our real estate business. Truly a premium agency experience.', active:true },
      { id:4, company:'Industrial Thermal Engineers', industry:'Thermal Engineering', stars:4, text:"Bentzen developed our custom ERP software with incredible precision. The system handles our complex thermal engineering workflows flawlessly.", active:true },
    ],
    faqs: [
      { id:1, q:'What services does Bentzen offer?', a:'Bentzen offers 8 premium services including App Development, Website Development, Custom Software, Facebook/Google/Instagram Ads, WhatsApp Automation, and UGC Ads.', active:true },
      { id:2, q:'How long does it take to build a website or app?', a:'Website: 2-4 weeks. Mobile App: 4-12 weeks. Custom Software: 6-16 weeks. We provide detailed timelines during the discovery phase.', active:true },
      { id:3, q:'What is the cost of your services?', a:'Pricing is project-based and depends on scope and complexity. Contact us for a customized quote tailored to your requirements.', active:true },
      { id:4, q:'Do you work with businesses outside of Ahmedabad?', a:'Yes! We work with clients across India and internationally. Our remote-friendly workflow ensures seamless collaboration regardless of geography.', active:true },
    ],
    blogs: [
      { id:1, title:'Why Every Business Needs a Comprehensive Digital Strategy in 2026', category:'Digital Strategy', date:'July 2026', readTime:'8 min', active:true },
      { id:2, title:'Cross-Platform vs Native: Choosing the Right Mobile Strategy', category:'App Development', date:'June 2026', readTime:'6 min', active:true },
      { id:3, title:'Maximizing ROAS: Advanced Meta Ads Strategies for 2026', category:'Advertising', date:'May 2026', readTime:'5 min', active:true },
    ],
    contact: {
      phone1: '+91 99980 26204',
      phone2: '+91 97253 14629',
      email: 'Buildwithbentzen1@gmail.com',
      location: 'Ahmedabad, Gujarat, India',
      facebook: 'https://www.facebook.com/share/183HH4hJPS/',
      instagram: 'https://www.instagram.com/buildwithbentzen',
      twitter: 'https://x.com/withbentzen',
      whatsapp: 'https://wa.me/919998026204',
    },
    ads: [
      { id:1, type:'image', url:'', title:'Summer Offer', displaySeconds:10, enabled:false, scheduled:false, scheduleTime:'' },
    ],
    chatbotSettings: {
      enabled: true,
      greeting: 'Hello! 👋 Welcome to Bentzen — Build. Design. Elevate. How can I help you today?',
      collectLeads: true,
      autoStart: true,
      autoStartDelay: 5,
    },
    seo: {
      title: 'Bentzen — Build. Design. Elevate.',
      description: 'Premium digital agency in Ahmedabad specializing in App Development, Website Development, Custom Software, and Digital Advertising.',
      keywords: 'Bentzen, app development, website development, digital agency, Ahmedabad',
      ogImage: 'https://i.postimg.cc/tgjX9V2Y/Bentzen-Logo-modified.png',
    },
    footer: {
      copyright: '© 2026 Bentzen. All Rights Reserved.',
    },
    sliders: [
      { url:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600', caption:'App Development Excellence', active:true },
      { url:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600', caption:'Digital Growth Strategy', active:true },
      { url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600', caption:'Premium Web Development', active:true },
      { url:'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600', caption:'Performance Marketing', active:true },
      { url:'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1600', caption:'Social Media Advertising', active:true },
      { url:'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1600', caption:'WhatsApp Automation', active:true },
      { url:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600', caption:'Custom Software Solutions', active:true },
      { url:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600', caption:'Team Excellence', active:true },
    ],
    formSubmissions: [
      { id:1, name:'Rahul Shah', email:'rahul@example.com', phone:'+91 98765 43210', service:'Website Development', message:'Looking for a premium website for our manufacturing company.', time:'2026-07-15 14:32', read:false },
      { id:2, name:'Priya Mehta', email:'priya@startup.in', phone:'+91 87654 32109', service:'App Development', message:'Need an e-commerce app for iOS and Android.', time:'2026-07-14 09:15', read:true },
      { id:3, name:'Arjun Patel', email:'arjun@biz.com', phone:'', service:'Facebook Ads', message:'Want to run Facebook campaigns for our retail business.', time:'2026-07-13 16:48', read:true },
    ]
  };
}

/* ── Admin Auth ── */
const ADMIN_CREDENTIALS = { user: 'bentzen', pass: '2026' };
let adminLoggedIn = false;

window.openAdmin = function() {
  const overlay = document.getElementById('adminOverlay');
  if (overlay) overlay.classList.add('open');
  setTimeout(() => {
    const input = document.getElementById('adminUser');
    if (input) input.focus();
  }, 300);
};

window.doAdminLogin = function() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  const errEl = document.getElementById('adminLoginErr');
  if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
    adminLoggedIn = true;
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    renderAdminTab('dashboard');
    initAnalyticsLive();
  } else {
    errEl.textContent = 'Invalid credentials. Try again.';
    setTimeout(() => { errEl.textContent = ''; }, 3000);
  }
};

window.adminLogout = function() {
  adminLoggedIn = false;
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminOverlay').classList.remove('open');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
};

/* Enter key for login */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('adminOverlay');
    if (overlay && overlay.classList.contains('open') && !adminLoggedIn) {
      overlay.classList.remove('open');
    }
  }
  if (e.key === 'Enter' && document.getElementById('adminOverlay')?.classList.contains('open') && !adminLoggedIn) {
    doAdminLogin();
  }
});

/* URL-based admin access: #admin or /admin */
if (window.location.hash === '#admin' || window.location.pathname.includes('/admin')) {
  setTimeout(() => openAdmin(), 100);
}

/* ── Tab Switching ── */
window.switchAdminTab = function(tab, el) {
  document.querySelectorAll('.admin-nav-item').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = {
    dashboard:'Dashboard', content:'Content Editor', services:'Services Manager',
    reviews:'Reviews Manager', faqs:'FAQ Manager', blogs:'Blog Manager',
    media:'Media Library', ads:'Advertisement Manager', contact:'Contact Information',
    chatbot:'Chatbot Settings', seo:'SEO & Metadata', analytics:'Analytics & Reports',
    footer:'Footer & Copyright', sliders:'Hero Sliders', forms:'Form Submissions'
  };
  const titleEl = document.getElementById('adminTabTitle');
  if (titleEl) titleEl.textContent = titles[tab] || tab;
  renderAdminTab(tab);
};

function renderAdminTab(tab) {
  const content = document.getElementById('adminContent');
  if (!content) return;
  const store = getStore();

  switch(tab) {
    case 'dashboard': content.innerHTML = renderDashboard(store); break;
    case 'content': content.innerHTML = renderContent(); break;
    case 'services': content.innerHTML = renderServices(store); break;
    case 'reviews': content.innerHTML = renderReviews(store); break;
    case 'faqs': content.innerHTML = renderFAQs(store); break;
    case 'blogs': content.innerHTML = renderBlogs(store); break;
    case 'media': content.innerHTML = renderMedia(); break;
    case 'ads': content.innerHTML = renderAds(store); break;
    case 'contact': content.innerHTML = renderContact(store); break;
    case 'chatbot': content.innerHTML = renderChatbot(store); break;
    case 'seo': content.innerHTML = renderSEO(store); break;
    case 'analytics': content.innerHTML = renderAnalytics(store); break;
    case 'footer': content.innerHTML = renderFooter(store); break;
    case 'sliders': content.innerHTML = renderSliders(store); break;
    case 'forms': content.innerHTML = renderForms(store); break;
    default: content.innerHTML = '<p>Coming soon.</p>';
  }
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function renderDashboard(store) {
  const a = store.analytics;
  return `
    <div class="admin-dashboard-grid">
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div class="stat-val" id="liveVisitors">${a.visitors.toLocaleString()}</div>
        <div class="stat-lbl">Total Visitors</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
        <div class="stat-val">${a.sessions.toLocaleString()}</div>
        <div class="stat-lbl">Sessions</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-envelope-open"></i></div>
        <div class="stat-val">${a.formSubmissions}</div>
        <div class="stat-lbl">Form Submissions</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-robot"></i></div>
        <div class="stat-val">${a.chatbotInteractions}</div>
        <div class="stat-lbl">Chatbot Chats</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem">
      <div class="admin-chart-card">
        <h4>Device Distribution</h4>
        <div style="display:flex;flex-direction:column;gap:.8rem;margin-top:.5rem">
          ${renderBar('Mobile', a.devices.mobile, '#c8956c')}
          ${renderBar('Desktop', a.devices.desktop, '#5c8fd4')}
          ${renderBar('Tablet', a.devices.tablet, '#8fd4a5')}
        </div>
      </div>
      <div class="admin-chart-card">
        <h4>Top Countries</h4>
        <div style="display:flex;flex-direction:column;gap:.8rem;margin-top:.5rem">
          ${a.countries.map(([c,p]) => renderBar(c, parseInt(p), '#c8956c')).join('')}
        </div>
      </div>
    </div>

    <div class="admin-chart-card" style="margin-bottom:1.5rem">
      <h4>Recent Activity</h4>
      <div style="margin-top:.8rem;display:flex;flex-direction:column;gap:.8rem">
        ${a.recentActivity.map(e => `
          <div style="display:flex;align-items:center;gap:1rem;padding:.6rem 0;border-bottom:1px solid rgba(200,149,108,.06)">
            <span style="font-size:.7rem;color:var(--muted);min-width:80px">${e.time}</span>
            <span style="font-size:.78rem;color:var(--accent);min-width:140px">${e.event}</span>
            <span style="font-size:.78rem;color:var(--muted)">${e.detail}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div class="admin-chart-card">
        <h4>Popular Pages</h4>
        <div style="margin-top:.8rem;display:flex;flex-direction:column;gap:.6rem">
          ${store.analytics.popularPages.map(([p,pc]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(200,149,108,.06)">
              <span style="font-size:.8rem">${p}</span>
              <span style="font-size:.75rem;color:var(--accent)">${pc}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="admin-chart-card">
        <h4>Popular Services</h4>
        <div style="margin-top:.8rem;display:flex;flex-direction:column;gap:.6rem">
          ${store.analytics.popularServices.map(([s,sp]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(200,149,108,.06)">
              <span style="font-size:.8rem">${s}</span>
              <span style="font-size:.75rem;color:var(--accent)">${sp}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderBar(label, val, color) {
  return `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
        <span style="font-size:.75rem;color:var(--fg)">${label}</span>
        <span style="font-size:.75rem;color:var(--muted)">${val}%</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${val}%;background:${color};border-radius:3px;transition:width .6s ease"></div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════
   CONTENT EDITOR
══════════════════════════════════ */
function renderContent() {
  return `
    <div class="admin-section-title">Hero Section</div>
    <div class="admin-form-row">
      <div>
        <label class="admin-label">Hero Label</label>
        <input class="admin-input" id="heroLabel" value="Digital Agency — Est. 2026 · Ahmedabad, India">
      </div>
      <div>
        <label class="admin-label">Hero CTA Button Text</label>
        <input class="admin-input" id="heroCta" value="Explore Services">
      </div>
    </div>
    <label class="admin-label">Hero Headline</label>
    <input class="admin-input" id="heroHeadline" value="We Build, Design & Elevate Your Digital Presence">
    <label class="admin-label">Hero Subtext</label>
    <textarea class="admin-input" rows="3" id="heroSub">Bentzen is a premium full-service digital agency delivering world-class app development, web solutions, custom software, and performance marketing that transforms brands and drives measurable results.</textarea>
    <button class="admin-btn admin-btn-accent" onclick="updateHeroContent()"><i class="fas fa-save"></i> Save Hero Content</button>

    <div class="admin-section-title" style="margin-top:2rem">About Section</div>
    <label class="admin-label">About Intro Text</label>
    <textarea class="admin-input" rows="4" id="aboutIntro">Bentzen is a premium full-service digital agency headquartered in Ahmedabad, Gujarat, India. We specialize in transforming ambitious ideas into exceptional digital products and experiences that drive real business outcomes.</textarea>
    <label class="admin-label">About Body Text</label>
    <textarea class="admin-input" rows="5" id="aboutBody">Founded with a singular vision — to bridge the gap between world-class design and cutting-edge technology — Bentzen brings together a multidisciplinary team of developers, designers, strategists, and marketers.</textarea>
    <button class="admin-btn admin-btn-accent" onclick="showSaveNotif('About content')"><i class="fas fa-save"></i> Save About Content</button>

    <div class="admin-section-title" style="margin-top:2rem">Stats / Counters</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Projects (number)</label><input class="admin-input" value="150"></div>
      <div><label class="admin-label">Clients (number)</label><input class="admin-input" value="50"></div>
      <div><label class="admin-label">Services</label><input class="admin-input" value="8"></div>
      <div><label class="admin-label">Satisfaction %</label><input class="admin-input" value="100"></div>
    </div>
    <button class="admin-btn admin-btn-accent" onclick="showSaveNotif('Stats')"><i class="fas fa-save"></i> Save Stats</button>
  `;
}

window.updateHeroContent = function() {
  const label = document.getElementById('heroLabel')?.value;
  const headline = document.getElementById('heroHeadline')?.value;
  const sub = document.getElementById('heroSub')?.value;
  const heroLbl = document.querySelector('.hero-lbl');
  const heroH1 = document.querySelector('.hero h1');
  const heroP = document.querySelector('.hero p');
  if (heroLbl && label) heroLbl.textContent = label;
  if (heroH1 && headline) heroH1.textContent = headline;
  if (heroP && sub) heroP.textContent = sub;
  showSaveNotif('Hero content');
};

/* ══════════════════════════════════
   SERVICES MANAGER
══════════════════════════════════ */
function renderServices(store) {
  return `
    <div class="admin-section-title">Services Manager</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1.5rem">Toggle, reorder, or edit your services. Changes publish instantly.</p>
    <table class="admin-table">
      <thead><tr><th>Order</th><th>Icon</th><th>Service Name</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${store.services.map((s, i) => `
          <tr>
            <td style="color:var(--muted);font-size:.85rem">${s.order}</td>
            <td><i class="${s.icon}" style="color:var(--accent)"></i></td>
            <td style="font-weight:500">${s.name}</td>
            <td><span class="${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Active' : 'Inactive'}</span></td>
            <td>
              <button class="admin-btn admin-btn-accent" onclick="toggleService(${i})">
                <i class="fas fa-toggle-${s.active ? 'on' : 'off'}"></i> ${s.active ? 'Disable' : 'Enable'}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="admin-section-title" style="margin-top:2rem">Add New Service</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Service Name</label><input class="admin-input" id="newSvcName" placeholder="Service name"></div>
      <div><label class="admin-label">Icon Class (Font Awesome)</label><input class="admin-input" id="newSvcIcon" placeholder="fas fa-code"></div>
    </div>
    <label class="admin-label">Short Description</label>
    <textarea class="admin-input" id="newSvcDesc" rows="2" placeholder="Brief description of the service..."></textarea>
    <button class="admin-btn admin-btn-accent" onclick="addService()"><i class="fas fa-plus"></i> Add Service</button>
  `;
}

window.toggleService = function(idx) {
  const store = getStore();
  store.services[idx].active = !store.services[idx].active;
  saveStore(store);
  renderAdminTab('services');
  showSaveNotif('Service status');
};

window.addService = function() {
  const name = document.getElementById('newSvcName')?.value.trim();
  const icon = document.getElementById('newSvcIcon')?.value.trim();
  if (!name || !icon) { alert('Please fill in name and icon.'); return; }
  const store = getStore();
  store.services.push({ id: name.toLowerCase().replace(/\s/g, '-'), name, icon, active: true, order: store.services.length + 1 });
  saveStore(store);
  renderAdminTab('services');
  showSaveNotif('New service added');
};

/* ══════════════════════════════════
   REVIEWS MANAGER
══════════════════════════════════ */
function renderReviews(store) {
  return `
    <div class="admin-section-title">Reviews Manager</div>
    <table class="admin-table">
      <thead><tr><th>Company</th><th>Stars</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${store.reviews.map((r, i) => `
          <tr>
            <td>
              <strong style="display:block">${r.company}</strong>
              <span style="font-size:.72rem;color:var(--muted)">${r.industry}</span>
            </td>
            <td style="color:#d4a95c">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</td>
            <td><span class="${r.active ? 'badge-active' : 'badge-inactive'}">${r.active ? 'Visible' : 'Hidden'}</span></td>
            <td style="display:flex;gap:.5rem">
              <button class="admin-btn admin-btn-accent" onclick="toggleReview(${i})"><i class="fas fa-eye${r.active ? '-slash' : ''}"></i></button>
              <button class="admin-btn admin-btn-danger" onclick="deleteReview(${i})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="admin-section-title" style="margin-top:2rem">Add New Review</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Company Name</label><input class="admin-input" id="newRevCompany" placeholder="Company name"></div>
      <div><label class="admin-label">Industry</label><input class="admin-input" id="newRevIndustry" placeholder="Industry type"></div>
    </div>
    <div class="admin-form-row">
      <div>
        <label class="admin-label">Star Rating</label>
        <select class="admin-input" id="newRevStars">
          <option value="5">★★★★★ (5)</option>
          <option value="4">★★★★☆ (4)</option>
          <option value="3">★★★☆☆ (3)</option>
        </select>
      </div>
    </div>
    <label class="admin-label">Review Text</label>
    <textarea class="admin-input" id="newRevText" rows="3" placeholder="Review text..."></textarea>
    <button class="admin-btn admin-btn-accent" onclick="addReview()"><i class="fas fa-plus"></i> Add Review</button>
  `;
}

window.toggleReview = function(idx) {
  const store = getStore();
  store.reviews[idx].active = !store.reviews[idx].active;
  saveStore(store);
  renderAdminTab('reviews');
};

window.deleteReview = function(idx) {
  if (!confirm('Delete this review?')) return;
  const store = getStore();
  store.reviews.splice(idx, 1);
  saveStore(store);
  renderAdminTab('reviews');
  showSaveNotif('Review deleted');
};

window.addReview = function() {
  const company = document.getElementById('newRevCompany')?.value.trim();
  const industry = document.getElementById('newRevIndustry')?.value.trim();
  const stars = parseInt(document.getElementById('newRevStars')?.value) || 5;
  const text = document.getElementById('newRevText')?.value.trim();
  if (!company || !text) { alert('Please fill in company name and review text.'); return; }
  const store = getStore();
  store.reviews.push({ id: Date.now(), company, industry, stars, text, active: true });
  saveStore(store);
  renderAdminTab('reviews');
  showSaveNotif('Review added');
};

/* ══════════════════════════════════
   FAQ MANAGER
══════════════════════════════════ */
function renderFAQs(store) {
  return `
    <div class="admin-section-title">FAQ Manager</div>
    <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem">
      ${store.faqs.map((f, i) => `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.2rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
            <div style="flex:1">
              <strong style="font-size:.85rem;display:block;margin-bottom:.4rem">${f.q}</strong>
              <p style="font-size:.78rem;color:var(--muted)">${f.a}</p>
            </div>
            <div style="display:flex;gap:.5rem;flex-shrink:0">
              <span class="${f.active ? 'badge-active' : 'badge-inactive'}">${f.active ? 'Active' : 'Hidden'}</span>
              <button class="admin-btn admin-btn-accent" onclick="toggleFAQ(${i})"><i class="fas fa-toggle-on"></i></button>
              <button class="admin-btn admin-btn-danger" onclick="deleteFAQ(${i})"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="admin-section-title">Add New FAQ</div>
    <label class="admin-label">Question</label>
    <input class="admin-input" id="newFaqQ" placeholder="Enter question...">
    <label class="admin-label">Answer</label>
    <textarea class="admin-input" id="newFaqA" rows="3" placeholder="Enter answer..."></textarea>
    <button class="admin-btn admin-btn-accent" onclick="addFAQ()"><i class="fas fa-plus"></i> Add FAQ</button>
  `;
}

window.toggleFAQ = function(idx) {
  const store = getStore(); store.faqs[idx].active = !store.faqs[idx].active; saveStore(store); renderAdminTab('faqs');
};
window.deleteFAQ = function(idx) {
  if (!confirm('Delete FAQ?')) return;
  const store = getStore(); store.faqs.splice(idx, 1); saveStore(store); renderAdminTab('faqs');
};
window.addFAQ = function() {
  const q = document.getElementById('newFaqQ')?.value.trim();
  const a = document.getElementById('newFaqA')?.value.trim();
  if (!q || !a) { alert('Please fill in both question and answer.'); return; }
  const store = getStore();
  store.faqs.push({ id: Date.now(), q, a, active: true });
  saveStore(store); renderAdminTab('faqs'); showSaveNotif('FAQ added');
};

/* ══════════════════════════════════
   BLOG MANAGER
══════════════════════════════════ */
function renderBlogs(store) {
  return `
    <div class="admin-section-title">Blog Manager</div>
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${store.blogs.map((b, i) => `
          <tr>
            <td style="max-width:280px"><span style="font-size:.82rem">${b.title}</span></td>
            <td><span style="font-size:.75rem;color:var(--accent)">${b.category}</span></td>
            <td style="font-size:.78rem;color:var(--muted)">${b.date}</td>
            <td><span class="${b.active ? 'badge-active' : 'badge-inactive'}">${b.active ? 'Published' : 'Draft'}</span></td>
            <td style="display:flex;gap:.5rem">
              <button class="admin-btn admin-btn-accent" onclick="toggleBlog(${i})"><i class="fas fa-edit"></i></button>
              <button class="admin-btn admin-btn-danger" onclick="deleteBlog(${i})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="admin-section-title" style="margin-top:2rem">Add New Blog Post</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Title</label><input class="admin-input" id="newBlogTitle" placeholder="Blog post title"></div>
      <div><label class="admin-label">Category</label><input class="admin-input" id="newBlogCat" placeholder="Category"></div>
    </div>
    <div class="admin-form-row">
      <div><label class="admin-label">Date</label><input class="admin-input" id="newBlogDate" placeholder="e.g. July 2026"></div>
      <div><label class="admin-label">Read Time</label><input class="admin-input" id="newBlogTime" placeholder="e.g. 5 min"></div>
    </div>
    <label class="admin-label">Content (HTML allowed)</label>
    <textarea class="admin-input" id="newBlogContent" rows="6" placeholder="Write your blog post content here..."></textarea>
    <button class="admin-btn admin-btn-accent" onclick="addBlog()"><i class="fas fa-plus"></i> Publish Blog Post</button>
  `;
}

window.toggleBlog = function(idx) {
  const store = getStore(); store.blogs[idx].active = !store.blogs[idx].active; saveStore(store); renderAdminTab('blogs');
};
window.deleteBlog = function(idx) {
  if (!confirm('Delete blog post?')) return;
  const store = getStore(); store.blogs.splice(idx, 1); saveStore(store); renderAdminTab('blogs');
};
window.addBlog = function() {
  const title = document.getElementById('newBlogTitle')?.value.trim();
  const category = document.getElementById('newBlogCat')?.value.trim();
  const date = document.getElementById('newBlogDate')?.value.trim();
  const readTime = document.getElementById('newBlogTime')?.value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  const store = getStore();
  store.blogs.push({ id: Date.now(), title, category, date, readTime, active: true });
  saveStore(store); renderAdminTab('blogs'); showSaveNotif('Blog post published');
};

/* ══════════════════════════════════
   MEDIA LIBRARY
══════════════════════════════════ */
function renderMedia() {
  return `
    <div class="admin-section-title">Media Library</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1.5rem">Upload and manage images, videos, PDFs, and banners for the website.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem">
      <div>
        <label class="admin-label">Upload Image</label>
        <div class="upload-zone" onclick="document.getElementById('imgUpload').click()">
          <input type="file" id="imgUpload" accept="image/*" onchange="previewUpload(this,'imgPreview')" style="display:none">
          <i class="fas fa-image"></i>
          <p>Click to upload image (JPG, PNG, WebP)</p>
        </div>
        <div id="imgPreview"></div>
      </div>
      <div>
        <label class="admin-label">Upload Video</label>
        <div class="upload-zone" onclick="document.getElementById('vidUpload').click()">
          <input type="file" id="vidUpload" accept="video/*" onchange="previewUpload(this,'vidPreview')" style="display:none">
          <i class="fas fa-video"></i>
          <p>Click to upload video (MP4, WebM)</p>
        </div>
        <div id="vidPreview"></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <label class="admin-label">Upload PDF (Portfolio)</label>
        <div class="upload-zone" onclick="document.getElementById('pdfUpload').click()">
          <input type="file" id="pdfUpload" accept=".pdf" style="display:none">
          <i class="fas fa-file-pdf"></i>
          <p>Click to upload PDF</p>
        </div>
      </div>
      <div>
        <label class="admin-label">Upload Banner</label>
        <div class="upload-zone" onclick="document.getElementById('bannerUpload').click()">
          <input type="file" id="bannerUpload" accept="image/*" style="display:none">
          <i class="fas fa-panorama"></i>
          <p>Click to upload banner image</p>
        </div>
      </div>
    </div>

    <div class="admin-section-title" style="margin-top:2rem">External Image URL</div>
    <div style="display:flex;gap:1rem;align-items:flex-end">
      <div style="flex:1"><label class="admin-label">Image URL</label><input class="admin-input" id="extImgUrl" placeholder="https://..."></div>
      <button class="admin-btn admin-btn-accent" onclick="addExtImage()"><i class="fas fa-plus"></i> Add</button>
    </div>
  `;
}

window.previewUpload = function(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById(previewId);
  if (!preview) return;
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('image')) {
    preview.innerHTML = `<img src="${url}" style="width:100%;border-radius:8px;margin-top:.5rem;max-height:150px;object-fit:cover">`;
  } else if (file.type.startsWith('video')) {
    preview.innerHTML = `<video src="${url}" controls style="width:100%;border-radius:8px;margin-top:.5rem;max-height:150px"></video>`;
  }
  showSaveNotif(`${file.name} ready`);
};

window.addExtImage = function() {
  const url = document.getElementById('extImgUrl')?.value.trim();
  if (url) showSaveNotif('External image added to library');
};

/* ══════════════════════════════════
   ADVERTISEMENT MANAGER
══════════════════════════════════ */
function renderAds(store) {
  return `
    <div class="admin-section-title">Advertisement Manager</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1.5rem">Configure and schedule advertisements that auto-display on the live website.</p>

    ${store.ads.map((ad, i) => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1.2rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h4 style="font-size:.9rem">${ad.title}</h4>
          <label class="toggle-switch">
            <input type="checkbox" ${ad.enabled ? 'checked' : ''} onchange="toggleAd(${i},this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="admin-form-row">
          <div><label class="admin-label">Ad Type</label>
            <select class="admin-input" onchange="updateAdType(${i},this.value)">
              <option value="image" ${ad.type==='image'?'selected':''}>Image</option>
              <option value="video" ${ad.type==='video'?'selected':''}>Video</option>
            </select>
          </div>
          <div><label class="admin-label">Display Duration (seconds)</label>
            <input type="number" class="admin-input" value="${ad.displaySeconds}" min="5" max="300" onchange="updateAdDuration(${i},this.value)">
          </div>
        </div>
        <label class="admin-label">Ad Media URL</label>
        <input class="admin-input" placeholder="https://... (image or video URL)" value="${ad.url}" onchange="updateAdUrl(${i},this.value)">
        <div class="admin-form-row" style="margin-top:.8rem">
          <div>
            <label class="admin-label">Schedule Start Time</label>
            <input type="datetime-local" class="admin-input" value="${ad.scheduleTime}">
          </div>
          <div style="display:flex;align-items:flex-end;gap:.8rem">
            <button class="admin-btn admin-btn-accent" onclick="triggerAdPreview(${i})"><i class="fas fa-play"></i> Preview Ad</button>
            <button class="admin-btn admin-btn-danger" onclick="deleteAd(${i})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('')}

    <button class="admin-btn admin-btn-accent" onclick="addNewAd()"><i class="fas fa-plus"></i> Add New Advertisement</button>
  `;
}

window.toggleAd = function(idx, val) {
  const store = getStore(); store.ads[idx].enabled = val; saveStore(store); showSaveNotif('Ad status updated');
};
window.updateAdType = function(idx, val) {
  const store = getStore(); store.ads[idx].type = val; saveStore(store);
};
window.updateAdDuration = function(idx, val) {
  const store = getStore(); store.ads[idx].displaySeconds = parseInt(val); saveStore(store);
};
window.updateAdUrl = function(idx, val) {
  const store = getStore(); store.ads[idx].url = val; saveStore(store);
};
window.deleteAd = function(idx) {
  if (!confirm('Delete this ad?')) return;
  const store = getStore(); store.ads.splice(idx, 1); saveStore(store); renderAdminTab('ads');
};
window.addNewAd = function() {
  const store = getStore();
  store.ads.push({ id: Date.now(), type: 'image', url: '', title: 'New Advertisement', displaySeconds: 10, enabled: false, scheduled: false, scheduleTime: '' });
  saveStore(store); renderAdminTab('ads');
};
window.triggerAdPreview = function(idx) {
  const store = getStore();
  const ad = store.ads[idx];
  showAd(ad);
};

function showAd(ad) {
  const overlay = document.getElementById('adOverlay');
  const content = document.getElementById('adContent');
  const timerFill = document.getElementById('adTimerFill');
  const timerCount = document.getElementById('adTimerCount');
  if (!overlay || !content) return;

  if (ad.url) {
    if (ad.type === 'video') {
      content.innerHTML = `<video src="${ad.url}" autoplay muted loop style="width:100%;border-radius:10px"></video>`;
    } else {
      content.innerHTML = `<img src="${ad.url}" style="width:100%;border-radius:10px" onerror="this.style.display='none'">`;
    }
  } else {
    content.innerHTML = `<div style="padding:2rem;text-align:center"><i class="fas fa-ad" style="font-size:3rem;color:var(--accent);display:block;margin-bottom:1rem"></i><p style="color:var(--muted)">Advertisement Preview</p></div>`;
  }

  overlay.classList.add('show');
  let secs = ad.displaySeconds || 10;
  timerCount.textContent = secs;
  if (timerFill) timerFill.style.transition = `width ${secs}s linear`;
  setTimeout(() => { if (timerFill) timerFill.style.width = '0%'; }, 50);

  const countdown = setInterval(() => {
    secs--;
    if (timerCount) timerCount.textContent = secs;
    if (secs <= 0) { clearInterval(countdown); closeAd(); }
  }, 1000);
  overlay._countdown = countdown;
}

window.closeAd = function() {
  const overlay = document.getElementById('adOverlay');
  if (overlay) { overlay.classList.remove('show'); }
  const fill = document.getElementById('adTimerFill');
  if (fill) { fill.style.transition = 'none'; fill.style.width = '100%'; }
  if (overlay?._countdown) clearInterval(overlay._countdown);
};

/* ══════════════════════════════════
   CONTACT INFO
══════════════════════════════════ */
function renderContact(store) {
  const c = store.contact;
  return `
    <div class="admin-section-title">Contact Information</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Phone 1</label><input class="admin-input" id="cp1" value="${c.phone1}"></div>
      <div><label class="admin-label">Phone 2</label><input class="admin-input" id="cp2" value="${c.phone2}"></div>
    </div>
    <div class="admin-form-row">
      <div><label class="admin-label">Email</label><input class="admin-input" id="cemail" value="${c.email}"></div>
      <div><label class="admin-label">Location</label><input class="admin-input" id="cloc" value="${c.location}"></div>
    </div>
    <div class="admin-section-title" style="margin-top:1.5rem">Social Media Links</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Facebook URL</label><input class="admin-input" id="cfb" value="${c.facebook}"></div>
      <div><label class="admin-label">Instagram URL</label><input class="admin-input" id="cig" value="${c.instagram}"></div>
    </div>
    <div class="admin-form-row">
      <div><label class="admin-label">X (Twitter) URL</label><input class="admin-input" id="ctx" value="${c.twitter}"></div>
      <div><label class="admin-label">WhatsApp URL</label><input class="admin-input" id="cwa" value="${c.whatsapp}"></div>
    </div>
    <button class="admin-btn admin-btn-accent" onclick="saveContact()"><i class="fas fa-save"></i> Save Contact Info</button>
  `;
}

window.saveContact = function() {
  const store = getStore();
  store.contact.phone1 = document.getElementById('cp1')?.value || store.contact.phone1;
  store.contact.phone2 = document.getElementById('cp2')?.value || store.contact.phone2;
  store.contact.email = document.getElementById('cemail')?.value || store.contact.email;
  store.contact.location = document.getElementById('cloc')?.value || store.contact.location;
  store.contact.facebook = document.getElementById('cfb')?.value || store.contact.facebook;
  store.contact.instagram = document.getElementById('cig')?.value || store.contact.instagram;
  store.contact.twitter = document.getElementById('ctx')?.value || store.contact.twitter;
  store.contact.whatsapp = document.getElementById('cwa')?.value || store.contact.whatsapp;
  saveStore(store);
  applyContactToPage(store.contact);
  showSaveNotif('Contact info saved & published');
};

function applyContactToPage(c) {
  document.querySelectorAll('[data-contact-email]').forEach(el => el.textContent = c.email);
  document.querySelectorAll('[data-contact-phone1]').forEach(el => el.textContent = c.phone1);
}

/* ══════════════════════════════════
   CHATBOT SETTINGS
══════════════════════════════════ */
function renderChatbot(store) {
  const cs = store.chatbotSettings;
  return `
    <div class="admin-section-title">Chatbot Settings</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding:1rem;background:var(--card);border:1px solid var(--border);border-radius:10px">
      <div>
        <strong style="display:block;margin-bottom:.2rem">Chatbot Enabled</strong>
        <span style="font-size:.78rem;color:var(--muted)">Show/hide the chatbot widget on the website</span>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${cs.enabled ? 'checked' : ''} id="chatbotEnabled">
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding:1rem;background:var(--card);border:1px solid var(--border);border-radius:10px">
      <div>
        <strong style="display:block;margin-bottom:.2rem">Auto-Start Chat</strong>
        <span style="font-size:.78rem;color:var(--muted)">Automatically show notification badge to visitors</span>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${cs.autoStart ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding:1rem;background:var(--card);border:1px solid var(--border);border-radius:10px">
      <div>
        <strong style="display:block;margin-bottom:.2rem">Lead Collection</strong>
        <span style="font-size:.78rem;color:var(--muted)">Ask for name/email during chat conversations</span>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${cs.collectLeads ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
    <label class="admin-label">Greeting Message</label>
    <textarea class="admin-input" rows="3" id="chatGreeting">${cs.greeting}</textarea>
    <label class="admin-label">Auto-Start Delay (seconds)</label>
    <input type="number" class="admin-input" value="${cs.autoStartDelay}" min="1" max="60">

    <div class="admin-section-title" style="margin-top:1.5rem">Chatbot Knowledge Base</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">Add custom Q&A pairs to train the chatbot for specific queries.</p>
    <div class="admin-form-row">
      <div><label class="admin-label">Trigger Keywords</label><input class="admin-input" placeholder="e.g. pricing, cost, how much"></div>
      <div><label class="admin-label">Bot Response</label><input class="admin-input" placeholder="Response text..."></div>
    </div>
    <button class="admin-btn admin-btn-accent" onclick="saveChatbotSettings()"><i class="fas fa-save"></i> Save Chatbot Settings</button>
  `;
}

window.saveChatbotSettings = function() {
  const store = getStore();
  store.chatbotSettings.greeting = document.getElementById('chatGreeting')?.value || store.chatbotSettings.greeting;
  store.chatbotSettings.enabled = document.getElementById('chatbotEnabled')?.checked;
  saveStore(store);
  showSaveNotif('Chatbot settings saved');
};

/* ══════════════════════════════════
   SEO
══════════════════════════════════ */
function renderSEO(store) {
  const s = store.seo;
  return `
    <div class="admin-section-title">SEO & Metadata</div>
    <label class="admin-label">Page Title</label>
    <input class="admin-input" id="seoTitle" value="${s.title}">
    <label class="admin-label">Meta Description</label>
    <textarea class="admin-input" id="seoDesc" rows="2">${s.description}</textarea>
    <label class="admin-label">Keywords</label>
    <input class="admin-input" id="seoKw" value="${s.keywords}">
    <label class="admin-label">OG Image URL</label>
    <input class="admin-input" id="seoOg" value="${s.ogImage}">
    <button class="admin-btn admin-btn-accent" onclick="saveSEO()"><i class="fas fa-save"></i> Save SEO Settings</button>

    <div class="admin-section-title" style="margin-top:2rem">SEO Preview</div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.4rem">
      <div style="font-size:.7rem;color:var(--muted);margin-bottom:.3rem">Google Search Preview</div>
      <div style="color:#4ade80;font-size:.85rem;margin-bottom:.2rem">bentzen.in</div>
      <div style="color:#7c9cd8;font-size:1rem;margin-bottom:.4rem" id="seoPreviewTitle">${s.title}</div>
      <div style="font-size:.78rem;color:var(--muted)" id="seoPreviewDesc">${s.description}</div>
    </div>
  `;
}

window.saveSEO = function() {
  const store = getStore();
  const title = document.getElementById('seoTitle')?.value;
  const desc = document.getElementById('seoDesc')?.value;
  const kw = document.getElementById('seoKw')?.value;
  if (title) { store.seo.title = title; document.title = title; }
  if (desc) { store.seo.description = desc; document.querySelector('meta[name="description"]')?.setAttribute('content', desc); }
  if (kw) store.seo.keywords = kw;
  saveStore(store);
  document.getElementById('seoPreviewTitle').textContent = title;
  document.getElementById('seoPreviewDesc').textContent = desc;
  showSaveNotif('SEO settings saved & applied');
};

/* ══════════════════════════════════
   ANALYTICS
══════════════════════════════════ */
function renderAnalytics(store) {
  const a = store.analytics;
  return `
    <div class="admin-section-title">Analytics Overview</div>
    <div class="admin-dashboard-grid" style="margin-bottom:2rem">
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div class="stat-val">${a.visitors.toLocaleString()}</div>
        <div class="stat-lbl">Total Visitors</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-eye"></i></div>
        <div class="stat-val">${a.pageviews.toLocaleString()}</div>
        <div class="stat-lbl">Page Views</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-download"></i></div>
        <div class="stat-val">${a.downloads}</div>
        <div class="stat-lbl">PDF Downloads</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon"><i class="fas fa-ad"></i></div>
        <div class="stat-val">${a.adImpressions.toLocaleString()}</div>
        <div class="stat-lbl">Ad Impressions</div>
      </div>
    </div>

    <div class="admin-analytics-grid">
      <div class="admin-chart-card">
        <h4>Traffic Over Time</h4>
        <div style="margin-top:1rem;display:flex;flex-direction:column;gap:.5rem">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => {
            const vals = [180,220,195,240,280,210,165];
            return renderBar(d, Math.round(vals[i]/280*100), '#c8956c');
          }).join('')}
        </div>
      </div>
      <div class="admin-chart-card">
        <h4>Browsers</h4>
        <div style="margin-top:1rem;display:flex;flex-direction:column;gap:.6rem">
          ${a.browsers.map(([b, bp]) => renderBar(b, parseInt(bp), '#5c8fd4')).join('')}
        </div>
      </div>
      <div class="admin-chart-card">
        <h4>Countries</h4>
        <div style="margin-top:1rem;display:flex;flex-direction:column;gap:.6rem">
          ${a.countries.map(([c, cp]) => renderBar(c, parseInt(cp), '#8fd4a5')).join('')}
        </div>
      </div>
    </div>

    <div class="admin-section-title" style="margin-top:2rem">Form Submissions</div>
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Service</th><th>Time</th><th>Status</th></tr></thead>
      <tbody>
        ${store.formSubmissions.map(f => `
          <tr>
            <td><strong>${f.name}</strong></td>
            <td style="font-size:.8rem;color:var(--muted)">${f.email}</td>
            <td><span style="font-size:.75rem;color:var(--accent)">${f.service}</span></td>
            <td style="font-size:.75rem;color:var(--muted)">${f.time}</td>
            <td><span class="${f.read ? 'badge-active' : 'badge-inactive'}">${f.read ? 'Read' : 'New'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ══════════════════════════════════
   FOOTER
══════════════════════════════════ */
function renderFooter(store) {
  return `
    <div class="admin-section-title">Footer & Copyright</div>
    <label class="admin-label">Copyright Text</label>
    <input class="admin-input" id="footerCopy" value="${store.footer.copyright}">
    <label class="admin-label">Footer Tagline</label>
    <input class="admin-input" value="Premium digital solutions for forward-thinking brands. Build. Design. Elevate.">

    <div class="admin-section-title" style="margin-top:1.5rem">Footer Links</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">Add or remove links from the footer navigation columns.</p>
    <div class="admin-form-row">
      <div><label class="admin-label">Link Label</label><input class="admin-input" placeholder="e.g. Blog"></div>
      <div><label class="admin-label">Link URL</label><input class="admin-input" placeholder="e.g. #blog"></div>
    </div>
    <button class="admin-btn admin-btn-accent" style="margin-bottom:.5rem" onclick="addFooterLink()"><i class="fas fa-plus"></i> Add Link</button>
    <button class="admin-btn admin-btn-accent" onclick="saveFooter()"><i class="fas fa-save"></i> Save Footer</button>
  `;
}

window.saveFooter = function() {
  const store = getStore();
  const copy = document.getElementById('footerCopy')?.value;
  if (copy) {
    store.footer.copyright = copy;
    const el = document.getElementById('footerCopyright');
    if (el) el.textContent = copy;
  }
  saveStore(store);
  showSaveNotif('Footer saved & published');
};

window.addFooterLink = function() { showSaveNotif('Footer link added'); };

/* ══════════════════════════════════
   SLIDER MANAGER
══════════════════════════════════ */
function renderSliders(store) {
  return `
    <div class="admin-section-title">Hero Slider Manager</div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1.5rem">Manage the 8 auto-rotating background slides on the homepage.</p>

    <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem">
      ${store.sliders.map((s, i) => `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.2rem;display:flex;align-items:center;gap:1rem">
          <div style="width:80px;height:50px;border-radius:6px;background:url('${s.url}') center/cover no-repeat;flex-shrink:0;background-color:var(--bg2)"></div>
          <div style="flex:1">
            <input class="admin-input" value="${s.url}" placeholder="Image URL" style="margin-bottom:.4rem" onchange="updateSlider(${i},'url',this.value)">
            <input class="admin-input" value="${s.caption}" placeholder="Caption" onchange="updateSlider(${i},'caption',this.value)">
          </div>
          <div style="display:flex;flex-direction:column;gap:.4rem;align-items:center">
            <label class="toggle-switch">
              <input type="checkbox" ${s.active ? 'checked' : ''} onchange="updateSlider(${i},'active',this.checked)">
              <span class="toggle-slider"></span>
            </label>
            <button class="admin-btn admin-btn-danger" onclick="deleteSlide(${i})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="admin-section-title">Add New Slide</div>
    <div class="admin-form-row">
      <div><label class="admin-label">Image URL</label><input class="admin-input" id="newSlideUrl" placeholder="https://..."></div>
      <div><label class="admin-label">Caption</label><input class="admin-input" id="newSlideCaption" placeholder="Slide caption"></div>
    </div>
    <button class="admin-btn admin-btn-accent" onclick="addSlide()"><i class="fas fa-plus"></i> Add Slide</button>
  `;
}

window.updateSlider = function(idx, key, val) {
  const store = getStore(); store.sliders[idx][key] = val; saveStore(store);
};
window.deleteSlide = function(idx) {
  if (!confirm('Delete slide?')) return;
  const store = getStore(); store.sliders.splice(idx, 1); saveStore(store); renderAdminTab('sliders');
};
window.addSlide = function() {
  const url = document.getElementById('newSlideUrl')?.value.trim();
  const caption = document.getElementById('newSlideCaption')?.value.trim();
  if (!url) { alert('Please enter a slide image URL.'); return; }
  const store = getStore();
  store.sliders.push({ url, caption, active: true });
  saveStore(store); renderAdminTab('sliders'); showSaveNotif('Slide added');
};

/* ══════════════════════════════════
   FORM SUBMISSIONS
══════════════════════════════════ */
function renderForms(store) {
  return `
    <div class="admin-section-title">Form Submissions</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <p style="font-size:.82rem;color:var(--muted)">${store.formSubmissions.length} total submissions</p>
      <button class="admin-btn admin-btn-accent" onclick="exportFormData()"><i class="fas fa-download"></i> Export CSV</button>
    </div>
    ${store.formSubmissions.map((f, i) => `
      <div style="background:var(--card);border:1px solid ${f.read ? 'var(--border)' : 'var(--border2)'};border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
          <div>
            <strong style="display:block;margin-bottom:.2rem">${f.name}</strong>
            <span style="font-size:.75rem;color:var(--muted)">${f.email} ${f.phone ? '· ' + f.phone : ''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:.8rem">
            <span class="${f.read ? 'badge-active' : 'badge-inactive'}">${f.read ? 'Read' : 'New'}</span>
            <span style="font-size:.7rem;color:var(--muted)">${f.time}</span>
          </div>
        </div>
        <div style="margin-bottom:.8rem"><span style="font-size:.7rem;letter-spacing:.15em;color:var(--accent);text-transform:uppercase">Service: </span><span style="font-size:.82rem">${f.service}</span></div>
        <p style="font-size:.82rem;color:var(--muted);line-height:1.7">${f.message}</p>
        <div style="display:flex;gap:.8rem;margin-top:1rem">
          <a href="mailto:${f.email}?subject=Re: ${f.service} Inquiry" class="admin-btn admin-btn-accent"><i class="fas fa-reply"></i> Reply</a>
          <button class="admin-btn admin-btn-accent" onclick="markFormRead(${i})"><i class="fas fa-check"></i> Mark Read</button>
          <button class="admin-btn admin-btn-danger" onclick="deleteForm(${i})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('')}
  `;
}

window.markFormRead = function(idx) {
  const store = getStore(); store.formSubmissions[idx].read = true; saveStore(store); renderAdminTab('forms');
};
window.deleteForm = function(idx) {
  if (!confirm('Delete this submission?')) return;
  const store = getStore(); store.formSubmissions.splice(idx, 1); saveStore(store); renderAdminTab('forms');
};
window.exportFormData = function() {
  const store = getStore();
  const csv = ['Name,Email,Phone,Service,Message,Time', ...store.formSubmissions.map(f =>
    `"${f.name}","${f.email}","${f.phone || ''}","${f.service}","${f.message.replace(/"/g,'""')}","${f.time}"`
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'bentzen_submissions.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showSaveNotif('CSV exported');
};

/* ══════════════════════════════════
   PUBLISH & LIVE SYNC
══════════════════════════════════ */
window.publishChanges = function() {
  const store = getStore();
  applyStoreToPage(store);
  showPublishAnimation();
};

function applyStoreToPage(store) {
  /* Footer copyright */
  const footerEl = document.getElementById('footerCopyright');
  if (footerEl) footerEl.textContent = store.footer.copyright;

  /* SEO */
  if (store.seo.title) document.title = store.seo.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && store.seo.description) metaDesc.setAttribute('content', store.seo.description);

  /* Contact */
  applyContactToPage(store.contact);
}

function dispatchLiveUpdate(store) {
  /* In a real app, this would use WebSocket/SSE. Here we sync via localStorage events */
  window.dispatchEvent(new CustomEvent('bentzenUpdate', { detail: store }));
}

window.addEventListener('bentzenUpdate', e => {
  if (!adminLoggedIn) applyStoreToPage(e.detail);
});

function showPublishAnimation() {
  const btn = document.querySelector('.admin-publish-btn');
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> Published!';
  btn.style.background = '#4ade80';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = '';
  }, 2000);
}

function showSaveNotif(msg) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);
    background:var(--card);border:1px solid var(--border2);
    padding:.8rem 1.6rem;border-radius:30px;font-size:.78rem;color:var(--fg);
    z-index:99999;opacity:0;transition:all .3s ease;
    backdrop-filter:blur(20px);pointer-events:none;
    box-shadow:0 8px 30px rgba(0,0,0,.3);
  `;
  notif.innerHTML = `<i class="fas fa-check" style="color:var(--accent);margin-right:.5rem"></i>${msg} saved successfully`;
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.opacity = '1'; notif.style.transform = 'translateX(-50%) translateY(0)'; }, 50);
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => notif.remove(), 300);
  }, 2800);
}

/* ── Live analytics counter ── */
function initAnalyticsLive() {
  setInterval(() => {
    const el = document.getElementById('liveVisitors');
    if (!el) return;
    const current = parseInt(el.textContent.replace(/,/g,'')) || 0;
    const newVal = current + Math.floor(Math.random() * 3);
    el.textContent = newVal.toLocaleString();
    const store = getStore();
    store.analytics.visitors = newVal;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, 8000);
}

/* ── Init ── */
(function init() {
  /* Apply store on page load */
  const store = getStore();
  applyStoreToPage(store);

  /* Check for scheduled ads */
  setInterval(() => {
    const s = getStore();
    s.ads.forEach(ad => {
      if (ad.enabled && ad.scheduled && ad.scheduleTime) {
        const schedTime = new Date(ad.scheduleTime);
        const now = new Date();
        if (Math.abs(now - schedTime) < 60000 && !ad._shown) {
          ad._shown = true;
          showAd(ad);
        }
      }
    });
  }, 30000);
})();
