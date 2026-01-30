describe.skip('OIDC State', () => {
  const BROKEN_URL_HASH =
    '#state=ebc8e454f3794afcab512efb234d686c&session_state=fe052e48-c1f7-4941-abd4-33374a407951&code=f87aeee6-228d-405c-88d8-146b1e0eb9b1.fe052e48-c1f7-4941-aaa4-33334a407951.5efe402b-7f07-4878-a419-6797ce7aeb3b';
  it('Should detect broken state in URL and refresh browser', () => {
    cy.login();

    // should pass normally
    cy.visit('/');

    cy.contains('Insights QA').should('exist');

    // Introduce broken state in URL

    Cypress.on('uncaught:exception', () => {
      // Error is expected to be thrown
      return false;
    });
    const pathname = `/foo/bar?baz=quaz${BROKEN_URL_HASH}`;
    cy.visit(pathname);

    cy.url().should('contain', BROKEN_URL_HASH);
    cy.wait(1000);
    cy.url().should('not.contain', BROKEN_URL_HASH);
    cy.window().then((win) => {
      Cypress.on('uncaught:exception', () => {
        // Enable cypress exceptions again
        return true;
      });
      cy.wait(1000);
      // The reloader should preserve pathname and query params
      const url = new URL(win.location.href);
      expect(url.pathname).to.eq('/foo/bar');
      expect(url.search).to.eq('?baz=quaz');
      cy.contains('Insights QA').should('exist');
    });
  });
});
