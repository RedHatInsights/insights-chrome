/**
 * Webpack loads this module in Node, but the stringified function runs in the browser.
 * This is stringified into a blocking head script. It must run before
 * PatternFly CSS loads so the initial theme classes are present for first paint.
 */
const initializeTheme = function () {
  try {
    var isLightwellRoute = window.location.pathname === '/lightwell' || window.location.pathname.indexOf('/lightwell/') === 0;

    // Apply Felt theme on ALL routes before PatternFly CSS loads.
    // This prevents a flash of non-Felt styles while Unleash feature flags
    // are still loading. Once flags resolve, React takes over: if auto-felt
    // is disabled and the user has no saved preference, the class is removed.
    document.documentElement.classList.add('pf-v6-theme-felt');

    if (isLightwellRoute) {
      document.documentElement.classList.add('pf-v6-theme-glass');
    }

    var savedTheme = localStorage.getItem('chrome:theme');
    var isDark = savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('pf-v6-theme-dark');
    }
  } catch (error) {
    // Theme initialization is best effort when storage or media queries are unavailable.
  }
};

module.exports = `(${initializeTheme.toString()})();`;
