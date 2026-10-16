/* ============================================================================
   NATURE CARE — CONSTELLATION FIELD ENGINE  (v7, clean rewrite)
   One reliable, elegant effect everywhere: a field of glowing energy nodes
   (gold / cyan / white) joined by faint lines — a live sensor network
   guarding the perimeter. Gentle drift, mouse repel, occasional "pulse"
   that travels between linked nodes. Plain canvas 2D. No WebGL, no photos.
   ============================================================================ */
(function (global) {
    'use strict';

    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    var rnd = mulberry32(20060612);
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    var COLORS = [
        { c: '255,182,39',  w: 0.34 },  // solar gold
        { c: '63,216,232',  w: 0.22 },  // cyan
        { c: '244,239,230', w: 0.44 }   // warm white
    ];
    function pickColor(r) {
        var x = r, acc = 0;
        for (var i = 0; i < COLORS.length; i++) { acc += COLORS[i].w; if (x <= acc) return COLORS[i].c; }
        return COLORS[2].c;
    }

    var NCE = {
        canvas: null, ctx: null, w: 0, h: 0, dpr: 1,
        nodes: [], links: [], pulses: [],
        mx: -9999, my: -9999, scrollV: 0,
        running: false, reduced: false, lastT: 0,
        linkDist: 150, pulseTimer: 1.2,

        init: function (opts) {
            opts = opts || {};
            this.canvas = opts.canvas || document.getElementById('field');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.reduced = !!opts.reduced;
            var self = this;
            this._onResize = function () { self.resize(); };
            global.addEventListener('resize', this._onResize);
            global.addEventListener('mousemove', function (e) { self.mx = e.clientX; self.my = e.clientY; }, { passive: true });
            global.addEventListener('mouseout', function () { self.mx = -9999; self.my = -9999; }, { passive: true });
            global.addEventListener('scroll', function () { self.scrollV = global.scrollY; }, { passive: true });
            this.resize();
            if (this.reduced) { this.drawFrame(0, 0.016); return; }
            this.running = true;
            this.lastT = performance.now();
            requestAnimationFrame(this._loop = this.loop.bind(this));
        },

        resize: function () {
            this.w = global.innerWidth; this.h = global.innerHeight;
            this.dpr = Math.min(global.devicePixelRatio || 1, 1.75);
            this.canvas.width = this.w * this.dpr;
            this.canvas.height = this.h * this.dpr;
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.build();
            if (this.reduced) this.drawFrame(0, 0.016);
        },

        build: function () {
            var r = mulberry32(20060612);
            var target = Math.round(this.w * this.h / 16000);      // density
            target = clamp(target, 40, 110);
            if (this.w < 760) target = Math.min(target, 55);
            this.linkDist = this.w < 760 ? 120 : 150;
            this.nodes = [];
            for (var i = 0; i < target; i++) {
                this.nodes.push({
                    x: r() * this.w, y: r() * this.h,
                    vx: (r() - 0.5) * 14, vy: (r() - 0.5) * 14,
                    r: 1.1 + r() * 1.9,
                    col: pickColor(r()),
                    ph: r() * Math.PI * 2, sp: 0.5 + r() * 1.4,
                    depth: 0.4 + r() * 0.6                       // parallax factor
                });
            }
            this.pulses = [];
        },

        loop: function (now) {
            if (!this.running) return;
            var dt = Math.min((now - this.lastT) / 1000, 0.05);
            this.lastT = now;
            if (!document.hidden) this.drawFrame(now / 1000, dt);
            requestAnimationFrame(this._loop);
        },

        drawFrame: function (t, dt) {
            var ctx = this.ctx, w = this.w, h = this.h;
            ctx.clearRect(0, 0, w, h);

            var i, j, n = this.nodes.length;
            var par = this.scrollV * 0.06; // gentle parallax offset

            // integrate
            for (i = 0; i < n; i++) {
                var nd = this.nodes[i];
                nd.x += nd.vx * dt; nd.y += nd.vy * dt;
                // wander
                nd.vx += Math.sin(t * nd.sp + nd.ph) * 1.4 * dt;
                nd.vy += Math.cos(t * nd.sp * 0.9 + nd.ph) * 1.4 * dt;
                // mouse repel
                var dx = nd.x - this.mx, dy = (nd.y - par * nd.depth) - this.my;
                var d2 = dx * dx + dy * dy;
                if (d2 < 140 * 140 && d2 > 0.01) {
                    var d = Math.sqrt(d2), f = (1 - d / 140) * 42 * dt;
                    nd.vx += (dx / d) * f; nd.vy += (dy / d) * f;
                }
                // speed cap + soft friction
                nd.vx *= 0.995; nd.vy *= 0.995;
                var sp2 = nd.vx * nd.vx + nd.vy * nd.vy;
                if (sp2 > 900) { var s = 30 / Math.sqrt(sp2); nd.vx *= s; nd.vy *= s; }
                // wrap
                if (nd.x < -20) nd.x = w + 20; else if (nd.x > w + 20) nd.x = -20;
                if (nd.y < -20) nd.y = h + 20; else if (nd.y > h + 20) nd.y = -20;
            }

            // links + collect for pulses
            this.links.length = 0;
            ctx.lineWidth = 1;
            for (i = 0; i < n; i++) {
                var a = this.nodes[i];
                var ay = a.y - par * a.depth;
                for (j = i + 1; j < n; j++) {
                    var b = this.nodes[j];
                    var by = b.y - par * b.depth;
                    var ddx = a.x - b.x, ddy = ay - by;
                    var dist2 = ddx * ddx + ddy * ddy;
                    if (dist2 > this.linkDist * this.linkDist) continue;
                    var dist = Math.sqrt(dist2);
                    var alpha = (1 - dist / this.linkDist) * 0.30;
                    ctx.strokeStyle = 'rgba(150,170,200,' + alpha.toFixed(3) + ')';
                    ctx.beginPath(); ctx.moveTo(a.x, ay); ctx.lineTo(b.x, by); ctx.stroke();
                    if (this.links.length < 400) this.links.push([i, j]);
                }
            }

            // nodes
            for (i = 0; i < n; i++) {
                var nd2 = this.nodes[i];
                var ny = nd2.y - par * nd2.depth;
                var tw = 0.55 + 0.45 * Math.sin(t * nd2.sp * 1.6 + nd2.ph);
                ctx.globalAlpha = 0.5 + 0.5 * tw;
                ctx.fillStyle = 'rgba(' + nd2.col + ',0.9)';
                ctx.beginPath(); ctx.arc(nd2.x, ny, nd2.r, 0, 6.283); ctx.fill();
                // glow for the larger nodes
                if (nd2.r > 2.1) {
                    var g = ctx.createRadialGradient(nd2.x, ny, 0, nd2.x, ny, nd2.r * 7);
                    g.addColorStop(0, 'rgba(' + nd2.col + ',' + (0.20 * tw) + ')');
                    g.addColorStop(1, 'rgba(' + nd2.col + ',0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(nd2.x - nd2.r * 7, ny - nd2.r * 7, nd2.r * 14, nd2.r * 14);
                }
            }
            ctx.globalAlpha = 1;

            // travelling pulses along random links (the "live network" beat)
            this.pulseTimer -= dt;
            if (this.pulseTimer <= 0 && this.links.length && this.pulses.length < 5) {
                this.pulseTimer = 0.7 + rnd() * 1.6;
                var lk = this.links[Math.floor(rnd() * this.links.length)];
                this.pulses.push({ a: lk[0], b: lk[1], s: 0, v: 1.4 + rnd() * 1.2, col: rnd() > 0.5 ? '255,182,39' : '63,216,232' });
            }
            for (i = this.pulses.length - 1; i >= 0; i--) {
                var pu = this.pulses[i];
                pu.s += pu.v * dt;
                if (pu.s >= 1) { this.pulses.splice(i, 1); continue; }
                var na = this.nodes[pu.a], nb = this.nodes[pu.b];
                if (!na || !nb) { this.pulses.splice(i, 1); continue; }
                var pay = na.y - par * na.depth, pby = nb.y - par * nb.depth;
                var px = na.x + (nb.x - na.x) * pu.s;
                var py = pay + (pby - pay) * pu.s;
                var pg = ctx.createRadialGradient(px, py, 0, px, py, 12);
                pg.addColorStop(0, 'rgba(255,255,255,0.9)');
                pg.addColorStop(0.3, 'rgba(' + pu.col + ',0.55)');
                pg.addColorStop(1, 'rgba(' + pu.col + ',0)');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.arc(px, py, 12, 0, 6.283); ctx.fill();
            }
        },

        destroy: function () { this.running = false; global.removeEventListener('resize', this._onResize); }
    };

    global.NCE = NCE;
})(window);
