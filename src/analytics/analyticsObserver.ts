/**
 * Function that will register a location observer which will trigger an action after document.location.href change.
 * We can't use "popstate" event listener because react apps are not using browser history but custom router history implementaion
 * which are not using history go, push, pop functions that trigger popstate event.
 * @param {Function} observeCallback callback that will be triggered after URL change
 */
const registerAnalyticsObserver = () => {
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  window.onload = function () {
    const bodyList = document.body;
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function () {
        const newLocation = document.location.href.replace(/#.*$/, '');
        if (oldHref !== newLocation && window.sendCustomEvent) {
          oldHref = newLocation;
          window.sendCustomEvent('pageBottom');
        }
      });
    });
    const config = {
      childList: true,
      subtree: true,
    };
    observer.observe(bodyList, config);
  };
};

export default registerAnalyticsObserver;
