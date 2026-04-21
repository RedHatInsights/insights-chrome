describe('ChunkLoadError e2e recovery', () => {
  beforeEach(() => {
    cy.login();
    // Module loading failures cause various uncaught exceptions from webpack
    // internals, Scalprum error handling, and browser-level script errors.
    // Since we deliberately block all federated module JS via forceNetworkError,
    // ANY uncaught exception is expected and should not fail the tests.
    // Use test-scoped cy.on so the handler is cleaned up automatically after each test.
    cy.on('uncaught:exception', () => false);
  });

  it('displays error page when a remote module fails to load', () => {
    // Intercept federated module JS — everything under /apps/ EXCEPT Chrome's
    // own bundle at /apps/chrome/. forceNetworkError triggers <script> onerror,
    // which is the only reliable way to make webpack/Scalprum detect the failure.
    // A 500 HTTP response does NOT trigger script.onerror (the browser fires
    // onload instead and silently fails to evaluate the invalid JS body).
    cy.intercept('GET', /\/apps\/(?!chrome\/).*\.js(\?.*)?$/, { forceNetworkError: true }).as('failedModuleJS');

    // Visit a route that loads a federated module (RBAC / my-user-access).
    // Chrome's shell loads normally; only the remote module JS is blocked.
    cy.visit('/settings/my-user-access');
    cy.wait('@failedModuleJS');

    // Scalprum catches the module loading error and renders DefaultErrorComponent
    // via the ErrorComponent prop on ScalprumComponent.
    cy.contains('Something went wrong', { timeout: 30000 }).should('be.visible');
  });

  it('shows a recovery link to return to the home page', () => {
    cy.intercept('GET', /\/apps\/(?!chrome\/).*\.js(\?.*)?$/, { forceNetworkError: true }).as('failedModuleJS');

    cy.visit('/settings/my-user-access');
    cy.wait('@failedModuleJS');
    cy.contains('Something went wrong', { timeout: 30000 }).should('be.visible');

    // The "Return to home page" link lets users recover from the error
    cy.contains('a', 'Return to home page').should('be.visible').and('have.attr', 'href', '/');
  });

  it('recovers when user returns to the home page', () => {
    cy.intercept('GET', /\/apps\/(?!chrome\/).*\.js(\?.*)?$/, { forceNetworkError: true }).as('failedModuleJS');

    cy.visit('/settings/my-user-access');
    cy.wait('@failedModuleJS');
    cy.contains('Something went wrong', { timeout: 30000 }).should('be.visible');

    // Remove webpack-dev-server error overlay — it appears because we deliberately
    // trigger network errors, and its z-index:2147483647 iframe covers our UI.
    // The overlay config in webpack.config.js is overridden by the proxy() spread.
    cy.document().then((doc) => {
      doc.getElementById('webpack-dev-server-client-overlay')?.remove();
    });

    // Click the recovery link — navigates to / which is Chrome's landing page
    // (no federated module needed, so it loads successfully)
    cy.contains('a', 'Return to home page').click();
    cy.location('pathname').should('eq', '/');
  });
});
