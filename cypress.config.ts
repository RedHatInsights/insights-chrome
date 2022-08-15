import { defineConfig } from "cypress";
const {
  addMatchImageSnapshotPlugin,
} = require('@simonsmith/cypress-image-snapshot/plugin');

export default defineConfig({
  component: {
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    excludeSpecPattern: ["/snapshots/*", "/image_snapshots/*", "/src/*"],
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
    },
    video: false,
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./config/webpack.cy.config.js"),
    },
  },
  e2e: {
    video: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
