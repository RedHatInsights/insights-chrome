describe('Landing page', () => {
  it('visit landing page', () => {
    cy.visit('/');

    cy.login();

    // check if a favorites link exists on the page
    cy.contains('View my favorite services').should('exist');
  });
});
