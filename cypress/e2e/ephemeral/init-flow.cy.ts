describe('Should login and initialize the app', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load the app', () => {
    cy.visit('/');
    // wait for Chrome to fully initialize
    cy.contains('h2', 'Welcome to your Hybrid Cloud Console').should('be.visible');
    // verify the user menu shows the logged-in user's full name
    cy.getUserFullName().then((name) => {
      cy.contains(name).should('exist');
    });
  });
});
