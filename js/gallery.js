/* Gallery: category filters + accessible lightbox (<dialog>). Without JS the
   grid still shows every image and each one is a plain thumbnail. */
(function () {
    'use strict';
    var buttons = document.querySelectorAll('[data-filter]');
    var items = document.querySelectorAll('.gal-item');
    buttons.forEach(function (b) {
        b.addEventListener('click', function () {
            var f = b.getAttribute('data-filter');
            buttons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
            items.forEach(function (it) {
                var show = f === 'all' || it.getAttribute('data-group') === f;
                it.hidden = !show;
                if (show) it.classList.add('rv-visible');
            });
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        });
    });

    var dlg = document.getElementById('lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var img = dlg.querySelector('img'), cap = dlg.querySelector('p'), opener = null;
    document.querySelectorAll('.gal-item button[data-full]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var thumb = btn.querySelector('img');
            opener = btn;
            img.src = btn.getAttribute('data-full');
            img.alt = thumb ? thumb.alt : '';
            var t = btn.querySelector('.cap b');
            cap.textContent = (t ? t.textContent + ' — ' : '') + (thumb ? thumb.alt : '');
            dlg.showModal();
        });
    });
    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { img.src = ''; if (opener) opener.focus(); });
})();
