describe('Should login and initialize the app', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the app', () => {
    cy.visit('/');
    // should find the dropdown menu with the name
    cy.contains('first_name last_name').should('exist');
  });
});
