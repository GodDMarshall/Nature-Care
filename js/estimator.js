/* ============================================================================
   NATURE CARE — FENCE PLANNER
   Implements the requirement sheet "Solar Fencing 13-Oct-2026" pp.1-3:
     I  Agri fence / farm / estate  — type (horizontal | tentacle), length,
        corners, wire lines → particulars p.1
     II Security / wall-top fence   — length, post height 4/6/8 ft, wire lines,
        post spacing 3/4 m → particulars p.2
   Quantities are only computed where the sheet shows the arithmetic
   (p.2: 150 m ÷ 3 m = 50 intermediate posts; 150 m × 8 lines = 1,200 m HT wire).
   Everything else is "on survey". The only prices shown are the approved
   power-set prices from p.3 (js/prices.js). The planner never submits anything itself — it only fills the
   existing assessment form (POST /submit-assessment).
   ========================================================================== */
(function () {
    'use strict';
    var root = document.querySelector('[data-estimator]');
    if (!root) return;
    root.hidden = false;

    var form = document.getElementById('est-form');
    var lenEl = document.getElementById('est-len');
    var cornersEl = document.getElementById('est-corners');
    var linesEl = document.getElementById('est-lines');
    var rowsEl = document.getElementById('est-rows');
    var subEl = document.getElementById('est-sub');
    var sendBtn = document.getElementById('est-send');
    var kitSubEl = document.getElementById('est-kit-sub');
    var kitPriceEl = document.getElementById('est-kit-price');
    var PR = window.NC_PRICES || null;
    var fmt = function (n) { return n.toLocaleString('en-IN'); };

    function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
    function num(el, min, max) {
        if (el.value.trim() === '') { el.removeAttribute('aria-invalid'); return null; }
        var n = Number(el.value);
        var ok = Number.isFinite(n) && Math.floor(n) === n && n >= min && n <= max;
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return ok ? n : NaN;
    }
    function onSurvey(basis) { return { q: null, basis: basis || '' }; }

    function compute() {
        var cat = val('est-cat');
        var L = num(lenEl, 1, 100000);
        var lines = num(linesEl, 1, 30);
        var corners = cat === 'agri' ? num(cornersEl, 0, 1000) : null;
        var plan = { cat: cat, L: L, lines: lines, corners: corners, rows: [] };

        if (cat === 'agri') {
            var type = val('est-type') === 'tentacle' ? 'Tentacle / hanging fence' : 'Horizontal fence';
            plan.type = type;
            plan.rows = [
                ['P.P. reel insulator', onSurvey()],
                ['Super strong insulator (C.P.)', onSurvey()],
                ['Wire tightener', onSurvey()],
                ['Corner post', onSurvey(corners > 0 ? fmt(corners) + ' corners entered' : '')],
                ['Support post', onSurvey()]
            ];
        } else {
            var h = Number(val('est-height')), s = Number(val('est-spacing'));
            plan.height = h; plan.spacing = s;
            var posts = L > 0 ? Math.ceil(L / s) : null;
            var wire = L > 0 && lines > 0 ? L * lines : null;
            plan.posts = posts; plan.wire = wire;
            plan.rows = [
                ['Intermediate post', posts ? { q: fmt(posts) + ' nos', basis: fmt(L) + ' m ÷ ' + s + ' m spacing' } : onSurvey()],
                ['G.I. square pipe / T-angle', onSurvey(h + ' ft post height')],
                ['High tensile (H.T.) wire', wire ? { q: fmt(wire) + ' m', basis: fmt(L) + ' m × ' + lines + ' lines' } : onSurvey()]
            ];
        }
        plan.power = PR && L > 0 ? PR.setFor(L) : null;
        return plan;
    }

    function renderKit(plan) {
        if (!kitSubEl || !kitPriceEl) return;
        if (!PR || !(plan.L > 0)) {
            kitSubEl.textContent = '· 1 set, sized to your boundary';
            kitPriceEl.hidden = true;
            return;
        }
        kitPriceEl.hidden = false;
        if (plan.power) {
            kitSubEl.textContent = '· ' + plan.power.name + ' (' + plan.power.band.toLowerCase() + ')';
            kitPriceEl.innerHTML = '';
            var b = document.createElement('b'); b.textContent = PR.inr(plan.power.price);
            kitPriceEl.appendChild(b);
            kitPriceEl.appendChild(document.createTextNode(' for the power generation system' +
                (plan.power.spec.length ? ' (' + plan.power.spec.join(', ') + ')' : '') + '.'));
        } else {
            kitSubEl.textContent = '· sized on survey';
            kitPriceEl.textContent = 'Boundaries over 1,000 m need a power system sized and priced on survey.';
        }
    }

    function render() {
        var cat = val('est-cat');
        form.querySelectorAll('[data-for]').forEach(function (el) { el.hidden = el.getAttribute('data-for') !== cat; });
        var plan = compute();
        rowsEl.innerHTML = '';
        plan.rows.forEach(function (r) {
            var tr = document.createElement('tr');
            var th = document.createElement('td'); th.textContent = r[0];
            if (r[1].basis) { var b = document.createElement('span'); b.className = 'basis'; b.textContent = r[1].basis; th.appendChild(b); }
            var td = document.createElement('td'); td.className = 'q' + (r[1].q ? '' : ' tbc'); td.textContent = r[1].q || 'On survey';
            tr.appendChild(th); tr.appendChild(td); rowsEl.appendChild(tr);
        });
        var bad = [plan.L, plan.lines, plan.corners].some(function (v) { return Number.isNaN(v); });
        if (bad) subEl.textContent = 'Please enter whole numbers (length 1–100,000 m, wire lines 1–30).';
        else if (!plan.L) subEl.textContent = 'Enter your boundary length to see your materials list.';
        else subEl.textContent = (cat === 'agri' ? 'Agri fence · ' + plan.type : 'Security fence · wall-top') + ' · ' + fmt(plan.L) + ' m boundary';
        sendBtn.disabled = bad || !plan.L;
        renderKit(bad ? {} : plan);
        return plan;
    }

    function summary(plan) {
        var out = ['Fence plan (from the website planner)'];
        if (plan.cat === 'agri') {
            out.push('Category: Agri fence / farm / estate', 'Type of fence: ' + plan.type);
            out.push('Boundary length: ' + fmt(plan.L) + ' m');
            if (plan.corners != null) out.push('Number of corners: ' + fmt(plan.corners));
            if (plan.lines) out.push('Number of wire lines: ' + plan.lines);
        } else {
            out.push('Category: Security fence / wall-top fence', 'Boundary length: ' + fmt(plan.L) + ' m');
            out.push('Height of the post: ' + plan.height + ' ft', 'Distance between posts: ' + plan.spacing + ' m');
            if (plan.lines) out.push('Number of wire lines: ' + plan.lines);
            if (plan.posts) out.push('Indicative intermediate posts: ' + fmt(plan.posts) + ' nos');
            if (plan.wire) out.push('Indicative H.T. wire: ' + fmt(plan.wire) + ' m');
        }
        if (plan.power) out.push('Power generation system: ' + plan.power.name + ' (' + plan.power.band + '), ' + PR.inr(plan.power.price));
        else if (PR) out.push('Power generation system: sized on survey');
        return out.join('\n');
    }

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    sendBtn.addEventListener('click', function () {
        var plan = render();
        if (sendBtn.disabled) return;
        var notes = document.getElementById('estimate-summary');
        var size = document.getElementById('property-size');
        if (notes) notes.value = summary(plan);
        // Boundary length field on the existing form is in km.
        if (size && (!size.value || size.dataset.fromPlanner === '1')) {
            size.value = String(Math.round(plan.L) / 1000);
            size.dataset.fromPlanner = '1';
        }
        var target = document.getElementById('assessment');
        if (target) {
            if (window.NC_scrollTo) window.NC_scrollTo(target); else target.scrollIntoView();
        }
        var first = document.getElementById('full-name');
        if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 700);
    });

    render();
})();
