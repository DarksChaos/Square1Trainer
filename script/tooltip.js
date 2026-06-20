// ═══════════════════════════════════════════════════════════════════════════
//  TOOLTIP
//  A single designed tooltip shared by every element carrying `data-tip`,
//  replacing the browser's native `title` bubble (which is unstyled and never
//  appears on touch devices). Shows on hover (after a short delay) and on
//  keyboard focus; hides on leave, click, scroll, or focus loss.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
    let tipEl = null, current = null, showTimer = null;

    function ensure() {
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.className = 'app-tooltip';
            tipEl.setAttribute('role', 'tooltip');
            document.body.appendChild(tipEl);
        }
        return tipEl;
    }

    function position(target) {
        const el = tipEl;
        const r  = target.getBoundingClientRect();
        el.style.left = '0px';
        el.style.top  = '0px';                 // reset so we can measure natural size
        const tr = el.getBoundingClientRect();

        let left   = r.left + r.width / 2 - tr.width / 2;
        let top    = r.top - tr.height - 8;
        let below  = false;
        if (top < 6) { top = r.bottom + 8; below = true; }
        left = Math.max(6, Math.min(left, window.innerWidth - 6 - tr.width));

        el.style.left = left + 'px';
        el.style.top  = top + 'px';
        el.classList.toggle('below', below);
    }

    function show(target) {
        const text = target.getAttribute('data-tip');
        if (!text) return;
        const el = ensure();
        el.textContent = text;
        el.style.display = 'block';
        position(target);
        el.classList.add('visible');
    }

    function hide() {
        clearTimeout(showTimer);
        showTimer = null;
        current = null;
        if (tipEl) { tipEl.classList.remove('visible'); tipEl.style.display = 'none'; }
    }

    document.addEventListener('mouseover', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t === current) return;
        hide();
        if (!t) return;
        current = t;
        showTimer = setTimeout(() => { if (current === t) show(t); }, 350);
    });
    document.addEventListener('mouseout', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t && t === current) hide();
    });

    document.addEventListener('focusin', (e) => {
        const t = e.target.closest?.('[data-tip]');
        if (t) { current = t; show(t); }
    });
    document.addEventListener('focusout', hide);

    // Any click (e.g. pressing the button the tip describes) or scroll dismisses it.
    document.addEventListener('click', hide, true);
    window.addEventListener('scroll', hide, true);
})();
