/* eslint-disable @typescript-eslint/no-namespace */
// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-localstorage-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('uncaught:exception', () => {
  // when running in Konflux CI, the overlay is not enabled, so we need to skip
  if (!process.env.KONFLUX_RUN) {
    // Find the iFrame that contains the overlay
    cy.get('iframe[id="webpack-dev-server-client-overlay"]').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      // Find and click the close button
      cy.wrap($body).find('button[aria-label="Close"]').click({ force: true });
    });
  }

  // Prevent Cypress from failing the test
  return false;
});

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      E2E_USER: string;
      E2E_PASSWORD: string;
    }
  }
}
