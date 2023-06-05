describe('Landing page', () => {
  it('visit landing page', () => {
    cy.login();

    cy.visit('/');

    cy.intercept({
      method: 'GET',
      url: '**/services/services.json',
    }).as('services');

    cy.wait('@services').its('response.statusCode').should('equal', 200);

    // check if a favorites link exists on the page
    cy.contains('View my favorite services').should('exist');
  });
});
