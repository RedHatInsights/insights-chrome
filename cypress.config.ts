import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    excludeSpecPattern: ["/snapshots/*", "/image_snapshots/*", "/src/*"],
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./config/webpack.cy.config.js"),
    },
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
