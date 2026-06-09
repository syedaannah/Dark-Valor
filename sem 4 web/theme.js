/*
================================================================
  theme.js — Dark / Light Mode Toggle
  - Applies class to <html> tag (prevents flash on load)
  - Saves preference to localStorage as 'arena_theme'
  - Works across ALL pages automatically
  - Just include: <script src="theme.js"></script>
================================================================
*/

(function () {
    const LS_KEY = 'arena_theme';

    // ── 1. Apply saved theme IMMEDIATELY on <html> before paint ──
    //    This prevents the white flash when refreshing in light mode
    const saved = localStorage.getItem(LS_KEY) || 'dark';
    if (saved === 'light') {
        document.documentElement.classList.add('light-mode');
    }

    // ── 2. Inject the toggle button once DOM is ready ─────────────
    function injectToggle() {
        if (document.getElementById('theme-toggle')) return;

        const isLight = document.documentElement.classList.contains('light-mode');

        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
        btn.innerHTML = `
            <span id="theme-icon">${isLight ? '🌙' : '☀️'}</span>
            <span class="tooltip" id="theme-tooltip">${isLight ? 'DARK MODE' : 'LIGHT MODE'}</span>
        `;
        document.body.appendChild(btn);
        btn.addEventListener('click', toggleTheme);
    }

    // ── 3. Toggle logic ───────────────────────────────────────────
    function toggleTheme() {
        const html    = document.documentElement;
        const isLight = html.classList.toggle('light-mode');
        const mode    = isLight ? 'light' : 'dark';

        // Persist to localStorage
        localStorage.setItem(LS_KEY, mode);

        // Update button icon & tooltip
        const icon    = document.getElementById('theme-icon');
        const tooltip = document.getElementById('theme-tooltip');
        const btn     = document.getElementById('theme-toggle');

        if (icon)    icon.textContent    = isLight ? '🌙' : '☀️';
        if (tooltip) tooltip.textContent = isLight ? 'DARK MODE' : 'LIGHT MODE';
        if (btn)     btn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');

        // Quick pop animation
        if (btn) {
            btn.style.transform = 'scale(1.35) rotate(20deg)';
            setTimeout(() => { btn.style.transform = ''; }, 220);
        }
    }

    // ── 4. Run after DOM ready ────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToggle);
    } else {
        injectToggle();
    }

})();