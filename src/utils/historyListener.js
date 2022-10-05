/**
 * Maximum SPA application switches
 */
const SWITCHES_LIMIT = 20;
let contextSwitches = 0;
let prevApp = '';
const historyListener = (location, action) => {
  const app = location.pathname.split('/').filter((s) => s.length > 0)[1];

  /**
   * If the browser hist the reload limit, force the browser refresh for current URL
   */
  if (contextSwitches === SWITCHES_LIMIT) {
    window.location.reload();
  }
  /**
   * Update app switches data
   */
  if (action === 'PUSH' && prevApp !== app) {
    prevApp = app;
    contextSwitches += 1;
  }
};

export default historyListener;
