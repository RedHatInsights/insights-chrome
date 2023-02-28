describe('Landing page', () => {
  it('visit landing page', () => {
    cy.visit('/');

    cy.wait(1000);

    // login into the session
    cy.get('#username-verification').type(Cypress.env('E2E_USER'));
    cy.get('#login-show-step2').click();
    cy.get('#password').type(Cypress.env('E2E_PASSWORD'));
    cy.get('#rh-password-verification-submit-button').click();

    // close cookies bar
    cy.get('#truste-consent-buttons').click();

    // check if a favorites link exists on the page
    cy.contains('View my favorite services').should('exist');
  });
});
