/* Decides whether the home hero gets the live Three.js fence or keeps the
   photo + SVG fallback. Skips WebGL when it is unavailable, when the visitor
   asked to save data, or on very low-memory devices; the page is complete
   without it either way. */
(function () {
    var html = document.documentElement;
    var conn = navigator.connection || {};
    var lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 2;
    var gl = false;
    try { var c = document.createElement('canvas'); gl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { gl = false; }
    if (!gl || conn.saveData || lowMem) { html.classList.add('no-webgl'); return; }
    import('./scene.js').catch(function (err) { html.classList.add('no-webgl'); if (window.console) console.warn('3D scene unavailable:', err && err.message); });
})();
