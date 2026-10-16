/* ============================================================================
   NATURE CARE — PUBLISHED PRICES (single source for the planner and chatbot)
   From the requirement sheet "Solar Fencing 13-Oct-2026" p.3, approved for
   publication by Marshall on 16-Oct-2026:
     Set I                    ₹28,000  (100 W solar panel, 100 Ah battery, NF 6000 energizer)
     Set II  500–1,000 m      ₹37,000
   The sheet gives no band for Set I; "up to 500 m" is inferred from Set II.
   Fences over 1,000 m are sized and priced on survey.
   These are prices for the power generation system only. Fence materials
   (posts, wire, insulators) are quoted after the site survey.
   ========================================================================== */
(function () {
    'use strict';
    var KIT = ['Solar panel', 'Battery', 'Energizer', 'Earth kit', 'Lead-out output cable',
               'Lightning diverter kit', 'Charge controller', 'Digital volt meter (DVM)'];
    var SETS = [
        { id: 'I', name: 'Set I', band: 'Up to 500 m', maxM: 500, price: 28000,
          spec: ['100 W solar panel', '100 Ah battery', 'NF 6000 energizer'] },
        { id: 'II', name: 'Set II', band: '500 m to 1,000 m', maxM: 1000, price: 37000, spec: [] }
    ];
    window.NC_PRICES = {
        kit: KIT,
        sets: SETS,
        callNow: { tel: '+919845571328', label: '98455 71328' },
        inr: function (n) { return '₹' + n.toLocaleString('en-IN'); },
        // Power set for a fence length in metres; null when it must be sized on survey.
        setFor: function (m) {
            if (!(m > 0)) return null;
            for (var i = 0; i < SETS.length; i++) if (m <= SETS[i].maxM) return SETS[i];
            return null;
        }
    };
})();
