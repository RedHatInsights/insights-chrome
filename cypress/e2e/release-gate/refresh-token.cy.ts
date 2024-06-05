// Landing page has changed
describe('Auth', () => {
  it('should force refresh token', () => {
    cy.login();
    cy.intercept('POST', 'https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token').as('tokenRefresh');
    cy.visit('/');
    // initial token request
    cy.wait('@tokenRefresh');

    // wait for chrome to init
    cy.contains('Services').should('be.visible');
    // intercept it after initial load
    // force token refresh
    cy.wait(1000);
    cy.window().then((win) => {
      win.insights.chrome.$internal.forceAuthRefresh();
    });

    cy.wait('@tokenRefresh').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  });
});
