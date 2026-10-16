
document.addEventListener('DOMContentLoaded', () => {


    const zoomImage = document.getElementById('zoom-hero-image');
    const zoomWrapper = document.getElementById('zoom-hero-wrapper');

    function updateZoomHero() {
        if (!zoomImage || !zoomWrapper) return;

        const wrapperRect = zoomWrapper.getBoundingClientRect();
        const scrollableDistance = zoomWrapper.offsetHeight - window.innerHeight;

        // Progress goes 0 -> 1 as the wrapper's sticky range scrolls past
        const scrolled = Math.min(Math.max(-wrapperRect.top, 0), scrollableDistance);
        const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

        const scale = 1 + progress * 0.55; // zooms from 1.0x to 1.55x
        const panX = progress * -2.5;       // subtle horizontal drift, in %
        const panY = progress * -1.5;       // subtle vertical drift, in %

        zoomImage.style.transform = `scale(${scale.toFixed(3)}) translate(${panX.toFixed(2)}%, ${panY.toFixed(2)}%)`;

        // Slightly darken further as we zoom in, like easing into shadow near the fence
        const scrim = document.querySelector('.zoom-hero-scrim');
        if (scrim) {
            scrim.style.opacity = String(0.6 + progress * 0.25);
        }
    }

    window.addEventListener('scroll', updateZoomHero);
    window.addEventListener('resize', updateZoomHero);
    updateZoomHero();

   
    const parallaxLayers = document.querySelectorAll('.parallax-bg');

    function updateParallax() {
        const scrollY = window.scrollY;
        parallaxLayers.forEach((layer) => {
            const section = layer.closest('.parallax-hero, .image-band');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            // Only animate when the section is anywhere near the viewport
            if (rect.bottom > -200 && rect.top < window.innerHeight + 200) {
                const speed = 0.35;
                const offset = (rect.top) * speed;
                layer.style.transform = `translateY(${offset}px)`;
            }
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });
    updateParallax();

    // 2. SCROLL-TRIGGERED REVEALS
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealEls.forEach((el) => revealObserver.observe(el));
    } else {
        // Fallback: just show everything if IntersectionObserver isn't supported
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // 3. VOLTAGE DIVIDER TRIGGER
    // Fires the traveling-current animation once each divider enters view.
    const voltageDividers = document.querySelectorAll('.voltage-divider');
    if ('IntersectionObserver' in window) {
        const voltageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    voltageObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        voltageDividers.forEach((el) => voltageObserver.observe(el));
    } else {
        voltageDividers.forEach((el) => el.classList.add('is-visible'));
    }

    // 4. COUNT-UP STAT NUMBERS
    // Animates any element with [data-count-to="2000"] from 0 to that value
    // when it scrolls into view. Preserves prefix/suffix text (e.g. "+", "KM").
    const countEls = document.querySelectorAll('[data-count-to]');

    function runCountUp(el) {
        const target = parseFloat(el.getAttribute('data-count-to'));
        const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1600;
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = target * eased;
            el.textContent = prefix + current.toFixed(decimals) + suffix;
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = prefix + target.toFixed(decimals) + suffix;
            }
        }
        requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    runCountUp(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });

        countEls.forEach((el) => countObserver.observe(el));
    } else {
        countEls.forEach((el) => {
            const target = parseFloat(el.getAttribute('data-count-to'));
            const prefix = el.getAttribute('data-prefix') || '';
            const suffix = el.getAttribute('data-suffix') || '';
            el.textContent = prefix + target + suffix;
        });
    }

    // 5. VOLTAGE NETWORK CANVAS
    // A live node-and-line "sensor network" graphic that sits behind hero
    // text — nodes drift slowly, nearby nodes connect with thin lines, and
    // a bright pulse of "current" periodically travels along a random path.
    const canvases = document.querySelectorAll('.voltage-network-canvas');

    canvases.forEach((canvas) => {
        const ctx = canvas.getContext('2d');
        let width, height, nodes, pulses;
        const NODE_COUNT_DENSITY = 1 / 14000; // nodes per square pixel
        const MAX_LINK_DIST = 160;

        function resize() {
            const parent = canvas.parentElement;
            width = canvas.width = parent.clientWidth;
            height = canvas.height = parent.clientHeight;
            const count = Math.max(18, Math.floor(width * height * NODE_COUNT_DENSITY));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
            }));
            pulses = [];
        }

        function maybeSpawnPulse() {
            if (Math.random() < 0.015 && nodes.length > 1) {
                const a = nodes[Math.floor(Math.random() * nodes.length)];
                const candidates = nodes.filter((n) => {
                    const d = Math.hypot(n.x - a.x, n.y - a.y);
                    return d > 0 && d < MAX_LINK_DIST;
                });
                if (candidates.length) {
                    const b = candidates[Math.floor(Math.random() * candidates.length)];
                    pulses.push({ a, b, t: 0 });
                }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            nodes.forEach((n) => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;
            });

            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < MAX_LINK_DIST) {
                        const opacity = (1 - dist / MAX_LINK_DIST) * 0.18;
                        ctx.strokeStyle = `rgba(165, 190, 0, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            nodes.forEach((n) => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(245, 247, 250, 0.5)';
                ctx.fill();
            });

            maybeSpawnPulse();
            pulses.forEach((p) => {
                p.t += 0.02;
                const x = p.a.x + (p.b.x - p.a.x) * p.t;
                const y = p.a.y + (p.b.y - p.a.y) * p.t;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(165, 190, 0, 0.95)';
                ctx.shadowColor = 'rgba(165, 190, 0, 0.9)';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            pulses = pulses.filter((p) => p.t < 1);

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        resize();
        draw();
    });

});