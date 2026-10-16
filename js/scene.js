/* ============================================================================
   NATURE CARE — HOLOGRAPHIC SOLAR FENCE (Three.js)  v8
   A real 3D CGI model of a Nature Care solar electric fence — posts, seven
   high-tensile wires with sag, insulators, a solar panel + energizer +
   battery unit, a warning board — rendered as a glowing holographic
   wireframe over a dotted perspective grid, with energy pulses racing along
   the wires and light streaming from the sun into the panel. Bloom post-fx.
   The camera flies between scenes as you scroll (GSAP ScrollTrigger scrub).
   ============================================================================ */
import * as THREE from 'three';
import { EffectComposer } from '../vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/postprocessing/UnrealBloomPass.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 760;
const canvas = document.getElementById('scene');
if (!canvas) throw new Error('#scene canvas missing');

/* ------------------------------------------------------------ palette */
const C = {
    bg: 0x040609,
    holo: 0x3AF2BC,        // teal-green hologram (nature + energy)
    holoDim: 0x1B7F68,
    grid: 0x2A4A5A,
    gold: 0xFFC53D,        // solar
    goldSoft: 0xFFE28A,
    white: 0xEAFBF4,
    cyan: 0x5FD7FF
};

/* ------------------------------------------------------------ renderer */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.6));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(C.bg, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(C.bg, isMobile ? 0.055 : 0.042);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-6, 3.2, 12);

/* ------------------------------------------------------------ helpers */
const holoLine = new THREE.LineBasicMaterial({ color: C.holo, transparent: true, opacity: 0.85 });
const holoLineDim = new THREE.LineBasicMaterial({ color: C.holoDim, transparent: true, opacity: 0.55 });
const goldLine = new THREE.LineBasicMaterial({ color: C.gold, transparent: true, opacity: 0.9 });
const cyanLine = new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.75 });

function edges(geo, mat, thresh = 20) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(geo, thresh), mat);
}
function vertexDots(geo, color, size = 0.06, opacity = 0.9) {
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    return pts;
}
function makeGlowSprite(color, size, opacity = 1) {
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 64;
    const g = cvs.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cvs);
    const mat = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(mat); s.scale.set(size, size, 1);
    return s;
}

/* ------------------------------------------------------------ world root */
const world = new THREE.Group();
scene.add(world);

/* ---------- dotted perspective grid floor ---------- */
(function buildGrid() {
    const N = isMobile ? 26 : 40, step = 1.0;
    const pos = [];
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) pos.push(i * step, 0, j * step);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: C.grid, size: 0.045, transparent: true, opacity: 0.85, sizeAttenuation: true, depthWrite: false });
    const p = new THREE.Points(g, m); p.position.y = -0.02;
    world.add(p);
    // faint grid lines every 5 units
    const lp = [];
    for (let i = -N; i <= N; i += 5) { lp.push(i, 0, -N, i, 0, N); lp.push(-N, 0, i, N, 0, i); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    world.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: C.grid, transparent: true, opacity: 0.18 })));
})();

/* ---------- the fence: posts + 7 wires with sag + insulators ---------- */
const FENCE = { posts: isMobile ? 9 : 13, spacing: 3.0, height: 2.4, wires: 7 };
const fence = new THREE.Group();
world.add(fence);
const wirePaths = [];      // per wire: array of THREE.Vector3 sample points (for pulses)
const postX = [];
(function buildFence() {
    const first = -((FENCE.posts - 1) * FENCE.spacing) / 2;
    const postGeo = new THREE.BoxGeometry(0.09, FENCE.height, 0.09);
    const insGeo = new THREE.TorusGeometry(0.06, 0.018, 6, 12);
    for (let i = 0; i < FENCE.posts; i++) {
        const x = first + i * FENCE.spacing; postX.push(x);
        const post = edges(postGeo, holoLine); post.position.set(x, FENCE.height / 2, 0); fence.add(post);
        // base plate
        const base = edges(new THREE.BoxGeometry(0.34, 0.04, 0.34), holoLineDim); base.position.set(x, 0.02, 0); fence.add(base);
        // insulators
        for (let w = 0; w < FENCE.wires; w++) {
            const y = 0.30 + w * ((FENCE.height - 0.30) / (FENCE.wires - 0.5));
            const ins = edges(insGeo, goldLine, 30); ins.rotation.y = Math.PI / 2; ins.position.set(x, y, 0.06); fence.add(ins);
        }
    }
    // wires with catenary sag between posts
    for (let w = 0; w < FENCE.wires; w++) {
        const y = 0.30 + w * ((FENCE.height - 0.30) / (FENCE.wires - 0.5));
        const pts = [];
        for (let i = 0; i < FENCE.posts - 1; i++) {
            const x0 = postX[i], x1 = postX[i + 1];
            for (let s = 0; s <= 10; s++) {
                const t = s / 10;
                const sag = Math.sin(t * Math.PI) * 0.045;
                pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y - sag, 0.06));
            }
        }
        wirePaths.push(pts);
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        fence.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: C.holo, transparent: true, opacity: 0.55 })));
        // dotted highlight along wire (the reference's particle look)
        fence.add(vertexDots(g, C.holo, 0.035, 0.7));
    }
})();

/* ---------- solar unit on one post: panel + energizer + battery ---------- */
const solarUnit = new THREE.Group();
const unitPostIndex = Math.floor(FENCE.posts * 0.62);
solarUnit.position.set(postX[unitPostIndex], 0, 0);
fence.add(solarUnit);
let panelWorldPos = new THREE.Vector3(), energizerWorldPos = new THREE.Vector3(), boardWorldPos = new THREE.Vector3();
(function buildSolar() {
    // taller mast behind the post
    const mast = edges(new THREE.CylinderGeometry(0.05, 0.06, 3.6, 8), holoLine); mast.position.set(0, 1.8, -0.5); solarUnit.add(mast);
    // panel
    const panel = new THREE.Group(); panel.position.set(0, 3.55, -0.5); panel.rotation.x = -0.55; solarUnit.add(panel);
    panel.add(edges(new THREE.BoxGeometry(1.5, 0.05, 1.0), cyanLine));
    // cell grid on panel face
    const cells = [];
    for (let i = 1; i < 6; i++) cells.push(-0.75 + i * 0.25, 0.03, -0.5, -0.75 + i * 0.25, 0.03, 0.5);
    for (let j = 1; j < 4; j++) cells.push(-0.75, 0.03, -0.5 + j * 0.25, 0.75, 0.03, -0.5 + j * 0.25);
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cells, 3));
    panel.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.35 })));
    // energizer box on the mast
    const enr = edges(new THREE.BoxGeometry(0.42, 0.55, 0.22), goldLine); enr.position.set(0, 1.55, -0.5); solarUnit.add(enr);
    // status LED
    const led = makeGlowSprite(C.holo, 0.22); led.position.set(0.12, 1.72, -0.37); solarUnit.add(led); solarUnit.userData.led = led;
    // battery box at base
    const bat = edges(new THREE.BoxGeometry(0.6, 0.4, 0.4), holoLineDim); bat.position.set(0, 0.2, -0.85); solarUnit.add(bat);
    // cables: panel→energizer→battery→top wire
    const cab = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.35, -0.5), new THREE.Vector3(0.1, 2.4, -0.62), new THREE.Vector3(0, 1.85, -0.5)]);
    solarUnit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cab.getPoints(24)), holoLineDim));
    const cab2 = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.28, -0.5), new THREE.Vector3(0.05, 0.7, -0.75), new THREE.Vector3(0, 0.4, -0.85)]);
    solarUnit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cab2.getPoints(24)), holoLineDim));
    const topWireY = 0.30 + (FENCE.wires - 1) * ((FENCE.height - 0.30) / (FENCE.wires - 0.5));
    const cab3 = new THREE.CatmullRomCurve3([new THREE.Vector3(0.21, 1.5, -0.5), new THREE.Vector3(0.35, 1.9, -0.2), new THREE.Vector3(0.05, topWireY, 0.06)]);
    solarUnit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cab3.getPoints(24)), goldLine));
    // warning board on the post
    const board = edges(new THREE.BoxGeometry(0.5, 0.34, 0.03), goldLine); board.position.set(0.02, 1.35, 0.11); solarUnit.add(board);
    const bolt = [0.03, 0.10, 0.03, -0.05, 0.02, 0.03, 0.06, 0.03, 0.03, -0.03, -0.10, 0.03];
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bolt, 3));
    const boltLine = new THREE.Line(bg, goldLine); boltLine.position.set(0.02, 1.35, 0.115); solarUnit.add(boltLine);
    solarUnit.userData.refs = { panel, enr, board };
})();

/* ---------- the sun (gold) + light stream to the panel ---------- */
const sun = makeGlowSprite(C.gold, 4.2, 0.95); sun.position.set(9, 9.5, -12); world.add(sun);
const sunHalo = makeGlowSprite(C.goldSoft, 12, 0.35); sunHalo.position.copy(sun.position); world.add(sunHalo);
const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16), new THREE.MeshBasicMaterial({ color: 0xFFF3C4 })); sunCore.position.copy(sun.position); world.add(sunCore);
// photon stream: particles flowing from sun to panel
const PHOTONS = isMobile ? 90 : 180;
const photonGeo = new THREE.BufferGeometry();
const photonPos = new Float32Array(PHOTONS * 3);
const photonT = new Float32Array(PHOTONS);
for (let i = 0; i < PHOTONS; i++) photonT[i] = Math.random();
photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
const photons = new THREE.Points(photonGeo, new THREE.PointsMaterial({ color: C.goldSoft, size: 0.09, transparent: true, opacity: 0.85, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }));
world.add(photons);

/* ---------- energy pulses along the wires ---------- */
const PULSES = isMobile ? 6 : 12;
const pulses = [];
for (let i = 0; i < PULSES; i++) {
    const s = makeGlowSprite(i % 3 === 0 ? C.gold : C.white, 0.5, 0.95);
    world.add(s);
    pulses.push({ sprite: s, wire: Math.floor(Math.random() * FENCE.wires), t: Math.random(), v: (0.06 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1) });
}
// wire glow duplicate (soft) — cheap fake bloom on the wires
wirePaths.forEach(pts => {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: C.holo, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending }));
    l.position.z = 0.061; l.scale.set(1, 1.004, 1); fence.add(l);
});

/* ---------- ambient floating dust ---------- */
(function dust() {
    const N = isMobile ? 120 : 260, pos = [];
    for (let i = 0; i < N; i++) pos.push((Math.random() - 0.5) * 40, Math.random() * 9, (Math.random() - 0.5) * 30);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: C.holo, size: 0.05, transparent: true, opacity: 0.35, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.userData.isDust = true; world.add(p);
})();

/* ------------------------------------------------------------ post-processing */
let composer = null, bloom = null;
try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), isMobile ? 0.9 : 1.15, 0.55, 0.12);
    composer.addPass(bloom);
    composer.setPixelRatio(renderer.getPixelRatio());
} catch (e) { composer = null; }

/* ------------------------------------------------------------ camera choreography */
// Each shot: camera position, look-at target. Interpolated by scroll progress on the home page.
const unitX = postX[unitPostIndex];
const SHOTS = [
    { pos: [-9.0, 3.6, 12.5], look: [3.8, 2.3, 0] },                       // 0 hero: fence low-right, headline breathes on the left
    { pos: [unitX - 4.2, 3.4, 5.4], look: [unitX, 2.6, -0.5] },             // 1 harvest: the panel + sun
    { pos: [unitX + 2.6, 1.9, 2.8], look: [unitX, 1.5, -0.4] },             // 2 store/energize: energizer + battery
    { pos: [postX[2] + 0.5, 1.15, 1.9], look: [postX[8], 1.25, 0] },        // 3 defend: low along the wires, pulses racing at you
    { pos: [4, 9.5, 14], look: [0, 0.8, 0] },                               // 4 perimeter: high pull-back
    { pos: [-5.5, 3.0, 10.5], look: [2.5, 1.9, 0] }                          // 5 settle: gentle 3/4 view for inner pages
];
if (isMobile) { // bring the camera in so the fence reads on a phone
    SHOTS[0] = { pos: [-5.5, 3.2, 8.5], look: [3.0, 2.2, 0] };
    SHOTS[4] = { pos: [3, 7.5, 10.5], look: [0, 0.8, 0] };
    SHOTS[5] = { pos: [-4, 2.8, 8], look: [2.0, 1.9, 0] };
}
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
let progress = 0;          // 0..1 along the story (home) — inner pages fix a shot
let fixedShot = null;
const dataShot = canvas.getAttribute('data-shot');
if (dataShot != null) fixedShot = parseInt(dataShot, 10);

function smoothstep(t) { return t * t * (3 - 2 * t); }
function shotAt(p) {
    if (fixedShot != null) {
        const s = SHOTS[Math.min(fixedShot, SHOTS.length - 1)];
        camPos.set(s.pos[0], s.pos[1], s.pos[2]); camLook.set(s.look[0], s.look[1], s.look[2]); return;
    }
    const n = SHOTS.length - 1;
    const f = Math.min(Math.max(p, 0), 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = smoothstep(f - i);
    const a = SHOTS[i], b = SHOTS[i + 1];
    tmpA.set(a.pos[0], a.pos[1], a.pos[2]); tmpB.set(b.pos[0], b.pos[1], b.pos[2]); camPos.lerpVectors(tmpA, tmpB, t);
    tmpA.set(a.look[0], a.look[1], a.look[2]); tmpB.set(b.look[0], b.look[1], b.look[2]); camLook.lerpVectors(tmpA, tmpB, t);
}
window.NC_setProgress = function (p) { progress = p; };
window.NC_shots = SHOTS.length;

/* ------------------------------------------------------------ hotspot projection (for HTML markers) */
const markers = Array.from(document.querySelectorAll('[data-hotspot]'));
const hotspotTargets = {
    panel: () => { const r = solarUnit.userData.refs.panel; r.getWorldPosition(panelWorldPos); return panelWorldPos; },
    energizer: () => { solarUnit.userData.refs.enr.getWorldPosition(energizerWorldPos); return energizerWorldPos; },
    board: () => { solarUnit.userData.refs.board.getWorldPosition(boardWorldPos); return boardWorldPos; },
    wire: () => { const pts = wirePaths[3]; return pts[Math.floor(pts.length * 0.5)]; },
    sun: () => sun.position
};
const proj = new THREE.Vector3();
function currentShotIndex() {
    if (fixedShot != null) return Math.min(fixedShot, SHOTS.length - 1);
    return Math.round(Math.min(Math.max(smoothP, 0), 1) * (SHOTS.length - 1));
}
function updateMarkers() {
    const shot = currentShotIndex();
    for (const m of markers) {
        const key = m.getAttribute('data-hotspot');
        const fn = hotspotTargets[key]; if (!fn) continue;
        const allowed = (m.getAttribute('data-shots') || '').split(',').map(Number);
        if (allowed.length && !allowed.includes(shot)) { m.style.opacity = '0'; continue; }
        proj.copy(fn()).project(camera);
        const visible = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
        m.style.opacity = visible ? '' : '0';
        m.style.transform = `translate(${((proj.x + 1) / 2 * window.innerWidth).toFixed(1)}px, ${((1 - proj.y) / 2 * window.innerHeight).toFixed(1)}px)`;
    }
}

/* ------------------------------------------------------------ mouse parallax */
let mx = 0, my = 0, tmx = 0, tmy = 0;
window.addEventListener('mousemove', e => { tmx = (e.clientX / window.innerWidth - 0.5); tmy = (e.clientY / window.innerHeight - 0.5); }, { passive: true });

/* ------------------------------------------------------------ resize */
function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) { composer.setSize(w, h); }
}
window.addEventListener('resize', onResize);

/* ------------------------------------------------------------ animate */
const clock = new THREE.Clock();
let smoothP = 0;
const sunDir = new THREE.Vector3(), panelPos = new THREE.Vector3();
function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // camera
    smoothP += (progress - smoothP) * Math.min(1, dt * 5);
    shotAt(smoothP);
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    camera.position.set(camPos.x + mx * 0.9, camPos.y - my * 0.5 + Math.sin(t * 0.35) * 0.06, camPos.z);
    camera.lookAt(camLook.x, camLook.y, camLook.z);

    // idle world sway (very subtle) — makes it feel alive when scroll is still
    world.rotation.y = Math.sin(t * 0.08) * 0.02;

    // pulses along wires
    for (const p of pulses) {
        p.t += p.v * dt;
        if (p.t > 1 || p.t < 0) { p.wire = Math.floor(Math.random() * FENCE.wires); p.t = p.v > 0 ? 0 : 1; p.v = (0.06 + Math.random() * 0.09) * (Math.random() > 0.5 ? 1 : -1); }
        const pts = wirePaths[p.wire];
        const f = p.t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
        p.sprite.position.lerpVectors(pts[i], pts[i + 1], k);
        p.sprite.material.opacity = 0.7 + 0.3 * Math.sin(t * 9 + i);
    }

    // photons: sun → panel
    solarUnit.userData.refs.panel.getWorldPosition(panelPos);
    for (let i = 0; i < PHOTONS; i++) {
        photonT[i] += dt * 0.22;
        if (photonT[i] > 1) photonT[i] -= 1;
        const s = photonT[i];
        // slight spread
        const spread = (1 - s) * 1.6;
        const ox = Math.sin(i * 12.9898) * spread, oy = Math.cos(i * 78.233) * spread * 0.4, oz = Math.sin(i * 39.7) * spread;
        photonPos[i * 3] = sun.position.x + (panelPos.x - sun.position.x) * s + ox;
        photonPos[i * 3 + 1] = sun.position.y + (panelPos.y - sun.position.y) * s + oy;
        photonPos[i * 3 + 2] = sun.position.z + (panelPos.z - sun.position.z) * s + oz;
    }
    photonGeo.attributes.position.needsUpdate = true;
    photons.material.opacity = 0.55 + 0.35 * Math.sin(t * 2.0);

    // sun breathing + LED heartbeat (1.2 s)
    const br = 1 + 0.05 * Math.sin(t * 0.9);
    sun.scale.set(4.2 * br, 4.2 * br, 1); sunHalo.scale.set(12 * br, 12 * br, 1);
    const led = solarUnit.userData.led; led.material.opacity = Math.sin(t * (Math.PI * 2 / 1.2)) > 0.6 ? 1 : 0.15;

    updateMarkers();
    if (composer) composer.render(); else renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
}
if (reduced) { progress = 0; frame(); } else requestAnimationFrame(frame);

document.documentElement.classList.add('scene-ready');
