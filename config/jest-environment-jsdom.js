const { TestEnvironment: JsdomEnvironment } = require('jest-environment-jsdom');

/**
 * Custom jest-environment-jsdom that exposes jsdom's reconfigure() as a global.
 *
 * In jsdom 26+ (bundled with jest-environment-jsdom 30), window.location is
 * non-configurable. Tests that need to change hostname or origin must use
 * jsdomReconfigure({ url: 'https://new-host.example.com/path' }) instead of
 * deleting/redefining window.location.
 */
class JsdomEnvironmentWithReconfigure extends JsdomEnvironment {
  async setup() {
    await super.setup();
    const defaultUrl = this.dom.window.location.href;
    this.global.jsdomReconfigure = (options) => {
      this.dom.reconfigure(options);
    };
    this.global.jsdomReset = () => {
      this.dom.reconfigure({ url: defaultUrl });
    };
  }
}

module.exports = JsdomEnvironmentWithReconfigure;
