describe('Auth', () => {
  it('should force refresh token', () => {
    cy.login();
    cy.visit('/');

    // wait for chrome to init
    cy.contains('h2', 'Welcome to your Hybrid Cloud Console').should('be.visible');

    // set up intercept THEN trigger refresh — no race condition
    cy.intercept('POST', 'https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token').as('tokenRefresh');

    cy.window().then((win) => {
      win.insights.chrome.$internal.forceAuthRefresh();
    });

    cy.wait('@tokenRefresh').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  });
});
