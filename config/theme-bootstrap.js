/**
 * Webpack loads this module in Node, but the stringified function runs in the browser.
 * This is stringified into a blocking head script. It must run before
 * PatternFly CSS loads so the initial theme classes are present for first paint.
 */
const initializeTheme = function () {
  try {
    var isLightwellRoute = window.location.pathname === '/lightwell' || window.location.pathname.indexOf('/lightwell/') === 0;

    if (isLightwellRoute) {
      document.documentElement.classList.add('pf-v6-theme-felt', 'pf-v6-theme-glass');
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
