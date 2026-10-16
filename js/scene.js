/* ============================================================================
   NATURE CARE — HERO FENCE (Three.js)  v9
   A solid, sunlit model of a Nature Care solar fence — steel posts on concrete
   footings, seven high-tensile wires with sag, insulators, a solar mast with
   PV module, energizer and battery, and a warning board — standing on a strip
   of grass in front of the landscape photograph behind the canvas. Light
   pulses travel along the wires as the "energized" metaphor.
   The canvas is transparent: the photo, the CSS sun bloom and the gradient
   shade are plain HTML layers, so the page still looks right if this module
   never runs (the SVG fence in .stage stays visible).
   The camera moves between shots as the home story scrolls (main.js calls
   window.NC_setProgress). Rendering stops when the story is off screen.
   Loaded only by js/scene-boot.js, after a capability check.
   ============================================================================ */
import * as THREE from 'three';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 760;
const canvas = document.getElementById('scene');
const story = document.querySelector('.story');
if (!canvas || !story) throw new Error('scene: canvas or story missing');

/* ------------------------------------------------------------ renderer */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: isMobile ? 'low-power' : 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const FOG = new THREE.Color(0x8c8466);           // warm haze sampled from the photo's horizon
scene.fog = new THREE.Fog(FOG, 18, isMobile ? 70 : 95);

const camera = new THREE.PerspectiveCamera(isMobile ? 52 : 40, 1, 0.05, 220);

/* ------------------------------------------------------------ light: low golden-hour sun from back right */
scene.add(new THREE.HemisphereLight(0xffe7c2, 0x1f2c19, 0.9));
const sunLight = new THREE.DirectionalLight(0xffc98a, 2.1);
sunLight.position.set(-14, 9, -18);
scene.add(sunLight);
const fill = new THREE.DirectionalLight(0x9fc4ff, 0.35);
fill.position.set(10, 4, 12);
scene.add(fill);

/* ------------------------------------------------------------ helpers */
function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
}
const glowTex = canvasTex(64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.22, 'rgba(255,255,255,0.6)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
});
function glow(color, size, opacity = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(size, size, 1); return s;
}
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ------------------------------------------------------------ the line */
const FENCE = { spacing: 3.2, count: isMobile ? 22 : 34, first: 7.2, height: 2.2, wires: 7 };
const postX = []; for (let i = 0; i < FENCE.count; i++) postX.push(FENCE.first - i * FENCE.spacing);
const wireY = (w) => 0.32 + w * ((FENCE.height - 0.42) / (FENCE.wires - 1));
const groundY = (x, z) => 0.05 * Math.sin(x * 0.11) + 0.04 * Math.sin(z * 0.6 + x * 0.05);

const steel = new THREE.MeshStandardMaterial({ color: 0x2d332f, metalness: 0.65, roughness: 0.42 });
const concrete = new THREE.MeshStandardMaterial({ color: 0x9a978d, roughness: 0.95 });
const blackPoly = new THREE.MeshStandardMaterial({ color: 0x111312, roughness: 0.55 });
const wireMat = new THREE.MeshStandardMaterial({ color: 0xd9dfdb, metalness: 0.9, roughness: 0.28 });

(function buildPosts() {
    const n = postX.length;
    const postGeo = new THREE.CylinderGeometry(0.055, 0.065, FENCE.height + 0.15, 10);
    const footGeo = new THREE.CylinderGeometry(0.17, 0.22, 0.32, 12);
    const insGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.11, 10); insGeo.rotateX(Math.PI / 2);
    const capGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.05, 10);
    const posts = new THREE.InstancedMesh(postGeo, steel, n);
    const feet = new THREE.InstancedMesh(footGeo, concrete, n);
    const caps = new THREE.InstancedMesh(capGeo, blackPoly, n);
    const ins = new THREE.InstancedMesh(insGeo, blackPoly, n * FENCE.wires);
    const m = new THREE.Matrix4();
    postX.forEach((x, i) => {
        const gy = groundY(x, 0);
        m.makeTranslation(x, gy + (FENCE.height + 0.15) / 2, 0); posts.setMatrixAt(i, m);
        m.makeTranslation(x, gy + 0.1, 0); feet.setMatrixAt(i, m);
        m.makeTranslation(x, gy + FENCE.height + 0.17, 0); caps.setMatrixAt(i, m);
        for (let w = 0; w < FENCE.wires; w++) { m.makeTranslation(x, gy + wireY(w), 0.07); ins.setMatrixAt(i * FENCE.wires + w, m); }
    });
    scene.add(posts, feet, caps, ins);
})();

const wirePaths = [];
(function buildWires() {
    for (let w = 0; w < FENCE.wires; w++) {
        const pts = [];
        for (let i = 0; i < postX.length - 1; i++) {
            const x0 = postX[i], x1 = postX[i + 1];
            for (let s = 0; s < 8; s++) {
                const t = s / 8, x = x0 + (x1 - x0) * t;
                pts.push(new THREE.Vector3(x, groundY(x, 0) + wireY(w) - Math.sin(t * Math.PI) * 0.035, 0.1));
            }
        }
        const last = postX[postX.length - 1]; pts.push(new THREE.Vector3(last, groundY(last, 0) + wireY(w), 0.1));
        wirePaths.push(pts);
        const curve = new THREE.CatmullRomCurve3(pts);
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 2, isMobile ? 0.011 : 0.008, 5, false), wireMat));
    }
})();

/* ------------------------------------------------------------ ground: grass strip + earth berm under the line */
(function buildGround() {
    const W = 150, D = 26, sx = 150, sz = 26;
    const g = new THREE.PlaneGeometry(W, D, sx, sz); g.rotateX(-Math.PI / 2); g.translate(-W / 2 + 14, 0, 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
    const cA = new THREE.Color(0x24391c), cB = new THREE.Color(0x3d5424), cEarth = new THREE.Color(0x5b4630), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, groundY(x, z) + (Math.abs(z) < 0.9 ? 0.06 * (1 - Math.abs(z) / 0.9) : 0));
        c.copy(cA).lerp(cB, 0.5 + 0.5 * Math.sin(x * 0.7 + z * 1.3) * Math.cos(z * 0.4));
        c.lerp(cEarth, Math.max(0, 1 - Math.abs(z) / 1.1) * 0.85);
        const backFade = THREE.MathUtils.smoothstep(z, -9, -3);          // fade into the photo behind the line
        const farFade = 1 - THREE.MathUtils.smoothstep(-x, 45, 110);      // and down the line
        col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = backFade * farFade;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    g.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false });
    scene.add(new THREE.Mesh(g, mat));

    // grass blades, instanced, densest along the line and in the foreground
    const N = isMobile ? 1800 : 6000;
    const blade = new THREE.ConeGeometry(0.012, 1, 3, 1, true); blade.translate(0, 0.5, 0);
    const grass = new THREE.InstancedMesh(blade, new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), gc = new THREE.Color();
    for (let i = 0; i < N; i++) {
        const x = 12 - Math.pow(rnd(), 1.6) * 80;
        let z = (rnd() - 0.5) * 2;
        z = z < 0 ? -Math.pow(-z, 0.8) * 3.5 : Math.pow(z, 0.8) * 2.6;   // keep blades off the camera lens
        if (Math.abs(z) < 0.3) z += Math.sign(z || 1) * 0.3;
        const h = 0.12 + rnd() * (Math.abs(z) < 1.2 ? 0.34 : 0.22);
        e.set((rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.5); q.setFromEuler(e);
        p.set(x, groundY(x, z), z); s.set(1, h, 1);
        m.compose(p, q, s); grass.setMatrixAt(i, m);
        gc.setHSL(0.24 + rnd() * 0.05, 0.45 + rnd() * 0.2, 0.18 + rnd() * 0.16); grass.setColorAt(i, gc);
    }
    scene.add(grass);
})();

/* ------------------------------------------------------------ solar unit: mast, PV module, energizer, battery, board */
const unitX = postX[2] - FENCE.spacing / 2;
const unit = new THREE.Group(); unit.position.set(unitX, groundY(unitX, -0.6), -0.6); scene.add(unit);
const refs = {};
(function buildUnit() {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.5, 10), steel); mast.position.y = 1.75; unit.add(mast);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12), concrete); foot.position.y = 0.1; unit.add(foot);
    // PV module with a cell texture
    const pvTex = canvasTex(256, 384, (g, w, h) => {
        g.fillStyle = '#0d1c2e'; g.fillRect(0, 0, w, h);
        const cw = w / 6, ch = h / 10;
        for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
            const gr = g.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch);
            gr.addColorStop(0, '#1d3b5e'); gr.addColorStop(1, '#0f2340');
            g.fillStyle = gr; g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
        }
        g.strokeStyle = 'rgba(200,215,230,0.35)'; g.lineWidth = 1;
        for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, h); g.stroke(); }
    });
    const panel = new THREE.Group(); panel.position.set(0, 3.55, 0); panel.rotation.order = 'YXZ'; panel.rotation.set(1.0, 0.9, 0); unit.add(panel);   // module tilted up, face turned toward the viewer
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.045, 1.6), new THREE.MeshStandardMaterial({ color: 0xc3c9cc, metalness: 0.35, roughness: 0.4 }));
    panel.add(frame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.54), new THREE.MeshStandardMaterial({ map: pvTex, metalness: 0.1, roughness: 0.25, side: THREE.DoubleSide }));
    face.rotation.x = -Math.PI / 2; face.position.y = 0.024; panel.add(face);
    refs.panel = panel;
    // energizer enclosure with the Nature Care mark
    const box = new THREE.Group(); box.position.set(0.0, 1.55, 0.12); unit.add(box);
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.64, 0.22), new THREE.MeshStandardMaterial({ color: 0x1b201d, metalness: 0.3, roughness: 0.5 }));
    box.add(shell);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x151917, roughness: 0.45 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.58), faceMat); front.position.z = 0.111; box.add(front);
    new THREE.TextureLoader().load('image/logo-light-mark.png', (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
        logo.position.set(0, 0.11, 0.113); box.add(logo); requestRender();
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.01), new THREE.MeshBasicMaterial({ color: 0x9be04a, toneMapped: false })); led.position.set(0, -0.16, 0.115); box.add(led);
    const ledGlow = glow(0x9be04a, 0.45, 0.9); ledGlow.position.set(0, -0.16, 0.14); box.add(ledGlow);
    refs.energizer = box; refs.led = ledGlow; refs.ledBar = led;
    // battery box at the foot
    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.42), new THREE.MeshStandardMaterial({ color: 0x232926, roughness: 0.7 })); bat.position.set(0.05, 0.36, -0.2); unit.add(bat);
    // cables
    const cable = (a, b, c) => unit.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, b, c]), 16, 0.012, 5), blackPoly));
    cable(new THREE.Vector3(0.05, 3.3, 0.05), new THREE.Vector3(0.14, 2.5, 0.12), new THREE.Vector3(0.12, 1.86, 0.15));
    cable(new THREE.Vector3(-0.12, 1.25, 0.12), new THREE.Vector3(-0.1, 0.8, 0.0), new THREE.Vector3(-0.1, 0.56, -0.15));
    cable(new THREE.Vector3(0.2, 1.3, 0.15), new THREE.Vector3(0.6, 1.9, 0.5), new THREE.Vector3(1.4, wireY(FENCE.wires - 1), 0.68));
    // warning board on the next post
    const boardTex = canvasTex(256, 176, (g, w, h) => {
        g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#111'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
        g.fillStyle = '#111'; g.beginPath(); g.moveTo(140, 22); g.lineTo(92, 96); g.lineTo(126, 96); g.lineTo(106, 156); g.lineTo(168, 72); g.lineTo(132, 72); g.closePath(); g.fill();
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.6 }));
    board.position.set(postX[1], groundY(postX[1], 0) + 1.25, 0.1); scene.add(board); refs.board = board;
})();

/* ------------------------------------------------------------ sun + travelling pulses */
const sun = glow(0xffd69a, 26, 0.55); sun.position.set(-24, 15, -60); scene.add(sun);
const PULSES = isMobile ? 5 : 10;
const pulses = [];
for (let i = 0; i < PULSES; i++) {
    const col = i % 3 === 0 ? 0xb6ec62 : 0x8fdcff;
    const head = glow(col, 0.55, 1), trail = [glow(col, 0.42, 0.6), glow(col, 0.32, 0.38), glow(col, 0.24, 0.2), glow(col, 0.18, 0.1)];
    scene.add(head); trail.forEach(t => scene.add(t));
    pulses.push({ head, trail, wire: (i * 3) % FENCE.wires, t: rnd(), v: 0.035 + rnd() * 0.04 });
}
function placeOnWire(sprite, pts, t) {
    const f = Math.min(Math.max(t, 0), 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f));
    sprite.position.lerpVectors(pts[i], pts[i + 1], f - i);
}

/* ------------------------------------------------------------ camera shots */
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = isMobile ? [
    { pos: P(5.2, 1.5, 3.8), look: P(-6, 0.4, -1.2) },
    { pos: P(unitX + 2.1, 3.0, 3.2), look: P(unitX - 0.2, 3.1, -0.6) },
    { pos: P(unitX + 1.3, 1.9, 2.6), look: P(unitX + 0.2, 1.2, -0.4) },
    { pos: P(9.5, 1.0, 1.3), look: P(-16, 1.2, 0) },
    { pos: P(16, 10, 18), look: P(-12, 0, -2) }
] : [
    { pos: P(9.6, 1.65, 4.6), look: P(-10, 1.55, -1.6) },
    { pos: P(unitX + 3.0, 3.0, 3.4), look: P(unitX - 1.6, 3.1, -0.4) },
    { pos: P(unitX + 1.7, 1.65, 2.6), look: P(unitX + 1.0, 1.4, -0.9) },
    { pos: P(9.5, 0.95, 1.25), look: P(-18, 1.15, 0.2) },
    { pos: P(17, 9, 17), look: P(-12, 0, -3) }
];
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let progress = 0, smoothP = 0;
function shotAt(p) {
    const n = SHOTS.length - 1, f = Math.min(Math.max(p, 0), 1) * n, i = Math.min(n - 1, Math.floor(f));
    let t = f - i; t = t * t * (3 - 2 * t);
    camPos.lerpVectors(SHOTS[i].pos, SHOTS[i + 1].pos, t);
    camLook.lerpVectors(SHOTS[i].look, SHOTS[i + 1].look, t);
}
window.NC_setProgress = (p) => { progress = reduced ? 0 : p; requestRender(); };
window.NC_shots = SHOTS.length;

/* ------------------------------------------------------------ hotspots */
const markers = Array.from(document.querySelectorAll('[data-hotspot]'));
const tmp = new THREE.Vector3();
const targets = {
    panel: () => refs.panel.getWorldPosition(tmp),
    energizer: () => refs.energizer.getWorldPosition(tmp),
    board: () => refs.board.getWorldPosition(tmp),
    wire: () => tmp.copy(wirePaths[3][Math.floor(wirePaths[3].length * 0.12)]),
    sun: () => tmp.copy(sun.position)
};
function updateMarkers(visible) {
    const shot = Math.round(Math.min(Math.max(smoothP, 0), 1) * (SHOTS.length - 1));
    const w = window.innerWidth, h = window.innerHeight;
    for (const m of markers) {
        const fn = targets[m.getAttribute('data-hotspot')];
        const allowed = (m.getAttribute('data-shots') || '').split(',').map(Number);
        if (!visible || !fn || !allowed.includes(shot)) { m.style.opacity = '0'; continue; }
        const v = fn().project(camera);
        const on = v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.92;
        m.style.opacity = on ? '1' : '0';
        m.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px)`;
    }
}

/* ------------------------------------------------------------ pointer depth */
let mx = 0, my = 0, tmx = 0, tmy = 0;
if (!isMobile && !reduced) window.addEventListener('pointermove', (e) => { tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5; }, { passive: true });

/* ------------------------------------------------------------ resize */
function onResize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    requestRender();
}
window.addEventListener('resize', onResize);

/* ------------------------------------------------------------ loop: runs only while the story is on screen */
const clock = new THREE.Clock();
let inView = true, running = false, pending = false;
function draw(dt, t) {
    smoothP += (progress - smoothP) * (reduced ? 1 : Math.min(1, dt * 4.5));
    shotAt(smoothP);
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    camera.position.set(camPos.x + mx * 0.6, camPos.y - my * 0.3 + (reduced ? 0 : Math.sin(t * 0.3) * 0.03), camPos.z + mx * 0.3);
    camera.lookAt(camLook);
    if (!reduced) {
        for (const p of pulses) {
            p.t -= p.v * dt;                                     // flow away from the energizer, down the line
            if (p.t < 0) { p.t = 0.02 + rnd() * 0.08; p.wire = Math.floor(rnd() * FENCE.wires); p.v = 0.03 + rnd() * 0.045; }
            const pts = wirePaths[p.wire];
            placeOnWire(p.head, pts, p.t);
            p.trail.forEach((s, k) => placeOnWire(s, pts, p.t + (k + 1) * 0.0028));
        }
        const beat = Math.sin(t * (Math.PI * 2 / 1.2)) > 0.55;  // 1.2 s pulse interval
        refs.led.material.opacity = beat ? 1 : 0.2;
    } else {
        pulses.forEach((p, i) => { const pts = wirePaths[p.wire]; placeOnWire(p.head, pts, 0.05 + i * 0.03); p.trail.forEach((s, k) => placeOnWire(s, pts, 0.05 + i * 0.03 + (k + 1) * 0.0035)); });
    }
    renderer.render(scene, camera);
    updateMarkers(inView);
}
function loop() {
    if (!inView || document.hidden) { running = false; return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    draw(dt, clock.elapsedTime);
    requestAnimationFrame(loop);
}
function start() { if (running || reduced) return; running = true; clock.getDelta(); requestAnimationFrame(loop); }
function requestRender() {
    if (!reduced) { start(); return; }
    if (pending) return; pending = true;
    requestAnimationFrame(() => { pending = false; draw(0, 0); });
}
new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    if (inView) { canvas.style.visibility = ''; requestRender(); }
    else { canvas.style.visibility = 'hidden'; updateMarkers(false); }
}, { threshold: 0 }).observe(story);
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestRender(); });

onResize();
shotAt(0); smoothP = progress;
draw(0, 0);
document.documentElement.classList.add('scene-ready');
requestRender();

/* debug/QA handle — lets automated checks jump to a shot without scrolling */
window.NCScene = { jump(i) { progress = smoothP = i / (SHOTS.length - 1); draw(0, clock.elapsedTime); }, info: () => ({ progress, smoothP, running, inView }) };
