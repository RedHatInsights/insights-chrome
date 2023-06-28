/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add('login', () => {
  cy.session(
    `login-${Cypress.env('E2E_USER')}`,
    () => {
      cy.visit('/');

      // login into the session
      cy.get('#username-verification').type(Cypress.env('E2E_USER'));
      cy.get('#login-show-step2').click();
      cy.get('#password').type(Cypress.env('E2E_PASSWORD'));
      cy.get('#rh-password-verification-submit-button').click();

      // close cookies bar
      cy.get('#truste-consent-buttons').click();

      cy.url().should('eq', `${Cypress.config().baseUrl}/`);
    },
    { cacheAcrossSpecs: true }
  );
});
