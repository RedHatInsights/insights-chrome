import React from 'react';
import OIDCUserManagerErrorBoundary, { SESSION_NOT_ACTIVE, TOKEN_NOT_ACTIVE } from '../../../src/auth/OIDCConnector/OIDCUserManagerErrorBoundary';
import { UserManager } from 'oidc-client-ts';
import ErrorBoundary from '../../../src/components/ErrorComponents/ErrorBoundary';
import { IntlProvider } from 'react-intl';

const ThrowAbleComponent = ({ error }: { error: any }) => {
  throw error;
};

describe('OIDCUserManagerErrorBoundary', () => {
  let basicFakeManager: UserManager;

  beforeEach(() => {
    // Suppress uncaught exceptions globally for all tests in this suite
    // since we're intentionally throwing errors to test error boundaries
    cy.on('uncaught:exception', () => {
      return false;
    });

    basicFakeManager = new UserManager({
      authority: '',
      client_id: '',
      redirect_uri: '',
    });
  });

  afterEach(() => {
    // Clean up UserManager to prevent memory leaks and state pollution
    basicFakeManager?.clearStaleState?.();
  });

  it('should render children if no error is thrown', () => {
    cy.mount(
      <OIDCUserManagerErrorBoundary userManager={basicFakeManager}>
        <h1>Child</h1>
      </OIDCUserManagerErrorBoundary>
    );

    cy.get('h1').should('exist');
  });

  it('Should bubble unrelated OIDC timeout error to parent error boundary', () => {
    cy.mount(
      <IntlProvider locale="en">
        <ErrorBoundary>
          <OIDCUserManagerErrorBoundary userManager={basicFakeManager}>
            <ThrowAbleComponent error="Fake error" />
          </OIDCUserManagerErrorBoundary>
        </ErrorBoundary>
      </IntlProvider>
    );

    cy.contains('Fake error').should('exist');
  });

  [SESSION_NOT_ACTIVE, ...TOKEN_NOT_ACTIVE.values()].forEach((error) => {
    it(`should redirect to signin page when "${error}" error is thrown`, () => {
      // Create a spy on signinRedirect before creating the manager
      const signinRedirectSpy = cy.spy().as('signinRedirect');

      const fakeManager = new UserManager({
        authority: '',
        client_id: '',
        redirect_uri: '',
      });

      // Replace signinRedirect with our spy
      fakeManager.signinRedirect = signinRedirectSpy;

      cy.mount(
        <OIDCUserManagerErrorBoundary userManager={fakeManager}>
          <ThrowAbleComponent error={{ error_description: error }} />
        </OIDCUserManagerErrorBoundary>
      );

      // Verify signinRedirect was called and AppPlaceholder is rendered
      cy.get('@signinRedirect').should('have.been.called');
      cy.get('.chr-c-page').should('exist');
    });
  });
});
