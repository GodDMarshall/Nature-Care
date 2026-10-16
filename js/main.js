/* ============================================================================
   NATURE CARE — INTERACTIONS (v9)
   Drives the 3D camera story from scroll, plus reveals / counters / nav,
   hero photo depth, and the mobile menu's keyboard behaviour.
   ============================================================================ */
(function () {
    'use strict';
    document.documentElement.classList.remove('no-js');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouch = window.matchMedia('(hover: none)').matches;
    var body = document.body;
    if (reduced) document.documentElement.classList.add('reduced');

    var hasGsap = typeof gsap !== 'undefined';
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    /* smooth scroll */
    var lenis = null;
    if (!reduced && typeof Lenis !== 'undefined') {
        lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
        window.__lenis = lenis; // QA / debugging handle
        lenis.on('scroll', function () { if (hasGsap) ScrollTrigger.update(); });
        if (hasGsap) { gsap.ticker.add(function (time) { lenis.raf(time * 1000); }); gsap.ticker.lagSmoothing(0); }
        else { (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(); }
    }

    /* 3D story: scroll → camera progress across the .story block */
    var story = document.querySelector('.story');
    function updateStory() {
        if (!story || typeof window.NC_setProgress !== 'function') return;
        var r = story.getBoundingClientRect();
        var total = r.height - window.innerHeight;
        var p = total > 0 ? (-r.top) / total : 0;
        window.NC_setProgress(Math.min(Math.max(p, 0), 1));
    }
    window.addEventListener('scroll', updateStory, { passive: true });
    if (lenis) lenis.on('scroll', updateStory);
    // the scene module may load after us — keep nudging until it hooks in
    var tries = 0, tick = setInterval(function () { updateStory(); if (++tries > 40 || typeof window.NC_setProgress === 'function') { clearInterval(tick); updateStory(); } }, 100);

    /* scene captions: fade each in/out around its viewport */
    if (hasGsap && !reduced) {
        document.querySelectorAll('.scene-copy').forEach(function (el) {
            gsap.fromTo(el, { opacity: 0, y: 40 }, {
                opacity: 1, y: 0, ease: 'none',
                scrollTrigger: { trigger: el.closest('.scene-sec'), start: 'top 70%', end: 'top 25%', scrub: 0.4 }
            });
            gsap.to(el, {
                opacity: 0, y: -40, ease: 'none',
                scrollTrigger: { trigger: el.closest('.scene-sec'), start: 'bottom 60%', end: 'bottom 20%', scrub: 0.4 }
            });
        });
    }

    /* anchors */
    function scrollToEl(el) {
        if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
    window.NC_scrollTo = scrollToEl;
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href').slice(1);
            var el = id && document.getElementById(id);
            if (!el) return;
            e.preventDefault(); closeMenu();
            scrollToEl(el);
            if (id === 'main') { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
        });
    });
    // arriving from another page with a hash (e.g. index.html#testimonials): let layout settle, then land precisely
    if (location.hash.length > 1) {
        var hashEl = document.getElementById(location.hash.slice(1));
        if (hashEl) window.addEventListener('load', function () { setTimeout(function () { if (lenis) lenis.scrollTo(hashEl, { offset: -70, immediate: true }); else hashEl.scrollIntoView(); }, 60); });
    }

    /* nav */
    var nav = document.querySelector('.site-nav');
    function onScrollNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', onScrollNav, { passive: true });
    if (lenis) lenis.on('scroll', onScrollNav);
    onScrollNav();
    var burger = document.getElementById('burger');
    function closeMenu() { if (!body.classList.contains('menu-open')) return; body.classList.remove('menu-open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); } if (lenis) lenis.start(); }
    if (burger) {
        burger.addEventListener('click', function () {
            var open = body.classList.toggle('menu-open');
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (lenis) { open ? lenis.stop() : lenis.start(); }
            if (open) { var first = document.querySelector('#mobile-menu a'); if (first) setTimeout(function () { first.focus(); }, 60); }
        });
        document.querySelectorAll('#mobile-menu a').forEach(function (a, i) { a.style.transitionDelay = (0.05 + i * 0.05) + 's'; a.addEventListener('click', closeMenu); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('menu-open')) { closeMenu(); burger.focus(); } });
    }

    /* hero intro */
    if (hasGsap && !reduced && document.querySelector('.hero')) {
        var tl = gsap.timeline({ delay: 0.2 });
        var lines = document.querySelectorAll('.hero .line-inner');
        if (lines.length) tl.from(lines, { yPercent: 110, duration: 1.0, ease: 'power4.out', stagger: 0.12 }, 0);
        tl.from('.hero .kicker', { opacity: 0, y: 14, duration: 0.6 }, 0.1)
          .from('.hero .lead', { opacity: 0, y: 22, duration: 0.8 }, 0.5)
          .from('.hero .hero-actions', { opacity: 0, y: 22, duration: 0.8 }, 0.65)
          .from('.hero .hero-proof, .hero .readout, .scroll-cue', { opacity: 0, duration: 0.8 }, 0.9);
    }
    if (hasGsap && !reduced && document.querySelector('.page-hero')) {
        gsap.from('.page-hero .wrap > *', { opacity: 0, y: 26, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.2 });
    }

    /* reveals */
    if (hasGsap && !reduced) {
        ScrollTrigger.batch('.rv', { start: 'top 88%', once: true, onEnter: function (els) { els.forEach(function (el, i) { setTimeout(function () { el.classList.add('rv-visible'); }, i * 80); }); } });
    } else { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('rv-visible'); }); }

    /* counters */
    function runCounter(el) {
        var to = parseFloat(el.getAttribute('data-count-to')), dec = parseInt(el.getAttribute('data-decimals') || '0', 10), suffix = el.getAttribute('data-suffix') || '';
        var fmt = function (v) { return v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
        if (!hasGsap || reduced) { el.textContent = fmt(to); return; }
        var o = { v: 0 }; gsap.to(o, { v: to, duration: 1.9, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); } });
    }
    if (hasGsap && !reduced) document.querySelectorAll('[data-count-to]').forEach(function (el) { ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { runCounter(el); } }); });
    else document.querySelectorAll('[data-count-to]').forEach(runCounter);

    /* image parallax */
    if (hasGsap && !reduced) document.querySelectorAll('[data-parallax-img] img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    });

    /* hero photo depth: the landscape drifts slower than the fence in front of it */
    var stagePhoto = document.querySelector('[data-stage-photo] img');
    if (stagePhoto && hasGsap && !reduced) {
        gsap.fromTo(stagePhoto, { yPercent: 0, scale: 1.06 }, { yPercent: 5, scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
        if (!isTouch) window.addEventListener('pointermove', function (e) {
            gsap.to(stagePhoto.parentElement, { x: (e.clientX / window.innerWidth - 0.5) * -14, y: (e.clientY / window.innerHeight - 0.5) * -8, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
        }, { passive: true });
    }

    /* magnetic buttons */
    if (!isTouch && !reduced && hasGsap) document.querySelectorAll('[data-magnetic]').forEach(function (el) {
        el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.24, duration: 0.45, ease: 'power3.out' }); });
        el.addEventListener('mouseleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }); });
    });

    var yr = document.getElementById('foot-year'); if (yr) yr.textContent = new Date().getFullYear();
    if (hasGsap && !reduced) window.addEventListener('load', function () { ScrollTrigger.refresh(); updateStory(); });
})();
