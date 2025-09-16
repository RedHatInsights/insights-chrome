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

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      E2E_USER: string;
      E2E_PASSWORD: string;
    }
  }
}
