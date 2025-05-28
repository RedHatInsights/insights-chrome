describe('Should login and initialize the app', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the app', () => {
    cy.visit('/');
    // should find the dropdown menu with the name
    cy.contains('Insights QA').should('exist');
  });
});
