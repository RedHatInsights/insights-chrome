/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from 'cypress';
const { addMatchImageSnapshotPlugin } = require('@simonsmith/cypress-image-snapshot/plugin');

export default defineConfig({
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  component: {
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['/snapshots/*', '/image_snapshots/*', '/src/*'],
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args = launchOptions.args.map((arg) => {
            if (arg === '--headless=new') {
              return '--headless';
            }

            return arg;
          });

          // Needs the extra 139 because of the cypress toolbar, this is the size of the window! not size of the viewport
          launchOptions.args.push(`--window-size=1280,${720 + 139}`);
          // force screen to be non-retina
          launchOptions.args.push('--force-device-scale-factor=1');
          // force screen to be retina (2800x2400 size)
          // launchOptions.args.push('--force-device-scale-factor=2')
        }

        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1280;
          launchOptions.preferences.height = 720;
        }

        if (browser.name === 'firefox' && browser.isHeadless) {
          launchOptions.args.push('--width=1280');
          launchOptions.args.push('--height=720');
        }

        return launchOptions;
      });
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    video: false,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('./config/webpack.cy.config.js'),
    },
  },
  e2e: {
    blockHosts: ['consent.trustarc.com'],
    baseUrl: process.env.BASE || 'https://stage.foo.redhat.com:1337',
    env: {
      E2E_USER: process.env.E2E_USER,
      E2E_PASSWORD: process.env.E2E_PASSWORD,
    },
    // To avoid any flaky issues we set the timeouts to be extra gracious
    // Slow tests are faster than rerunning flaky tests
    defaultCommandTimeout: 60000,
    requestTimeout: 60000,
    // required for the redirects to work correctly due to a chromium issue
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    screenshotOnRunFailure: false,
    // required for the SSO redirect
    chromeWebSecurity: false,
    video: false,
    setupNodeEvents(on, config) {
      require('cypress-localstorage-commands/plugin')(on, config);
      return config;
      // implement node event listeners here
    },
  },
});
