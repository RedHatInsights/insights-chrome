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

  // Register global exception handler before all tests to catch chunk loading errors
  before(() => {
    cy.on('uncaught:exception', () => {
      return false;
    });
  });

  beforeEach(() => {
    basicFakeManager = new UserManager({
      authority: '',
      client_id: '',
      redirect_uri: '',
    });
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
    it('should try redirect to signin page if error is thrown', () => {
      const fakeManager = new UserManager({
        authority: '',
        client_id: '',
        redirect_uri: '',
        metadataUrl: '/authorityUrl',
      });

      // Stub signinRedirect and track if it was called
      const signinRedirectStub = cy.stub(fakeManager, 'signinRedirect').resolves();

      cy.mount(
        <OIDCUserManagerErrorBoundary userManager={fakeManager}>
          <ThrowAbleComponent error={{ error_description: error }} />
        </OIDCUserManagerErrorBoundary>
      );

      // Verify signinRedirect was called instead of waiting for an HTTP request
      cy.wrap(null).then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(signinRedirectStub).to.have.been.calledOnce;
      });
    });
  });
});
