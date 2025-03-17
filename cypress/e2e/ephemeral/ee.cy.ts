describe('Ephemeral test', () => {
  beforeEach(() => {
    // cy.login();
  });
  it('should find all services page', () => {
    cy.visit('/allservices');
    cy.contains('All Services').should('exist');
    cy.get('.pf-v6-c-masthead__brand > div > .pf-v6-c-menu-toggle > .pf-v6-c-menu-toggle__text').click();
  });
});
