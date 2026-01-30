/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import useManageSilentRenew from '../../../src/auth/OIDCConnector/useManageSilentRenew';

const DummyComponent = ({ authMock, login }: { authMock: any; login: () => Promise<void> }) => {
  useManageSilentRenew(authMock, login);
  return <div>Dummy Component</div>;
};

describe('useManageSilentRenew', () => {
  function dispatchEventWithRetries(win: Window, eventName: string, isSatisfied: () => boolean, maxAttempts = 3, intervalMs = 1000): Promise<void> {
    return new Promise<void>((resolve) => {
      let attempts = 0;
      const fire = () => {
        win.dispatchEvent(new Event(eventName));
        if (isSatisfied() || attempts >= maxAttempts) {
          resolve();
          return;
        }
        attempts++;
        setTimeout(fire, intervalMs);
      };
      requestAnimationFrame(fire);
    });
  }

  it('should pause silent renew on network offline', () => {
    const authMock = { startSilentRenew: cy.stub(), stopSilentRenew: cy.stub() };
    const login = cy.stub();
    cy.mount(<DummyComponent authMock={authMock} login={login} />);
    cy.window().then((win) => dispatchEventWithRetries(win, 'offline', () => authMock.stopSilentRenew.called));
    cy.wrap(authMock.stopSilentRenew).should('have.been.called');
    cy.wrap(authMock.startSilentRenew).should('not.have.been.called');
    cy.window().then((win) => dispatchEventWithRetries(win, 'online', () => authMock.startSilentRenew.called));
    cy.wrap(authMock.startSilentRenew).should('have.been.called');
  });

  it('should call the login function if silent renew is re-started and auth is expired', () => {
    // The cy.clock does not work with React component testing
    // had to set the expires_at to -1 to simulate expired token
    // https://github.com/cypress-io/cypress/issues/9674
    const authMock = {
      startSilentRenew: cy.stub(),
      stopSilentRenew: cy.stub(),
      // Date 10s from now in UNIX format
      user: { expires_at: -1 },
    };
    const login = cy.stub();

    cy.mount(<DummyComponent authMock={authMock} login={login} />);
    cy.window().then((win) => {
      expect(login).to.not.be.called;
      win.dispatchEvent(new Event('online'));
      expect(login).to.be.called;
    });
  });

  function toggleDocumentVisibility(doc: Document) {
    cy.stub(doc, 'visibilityState').value('hidden');
    doc.dispatchEvent(new Event('visibilitychange'));
    cy.stub(doc, 'visibilityState').value('visible');
    doc.dispatchEvent(new Event('visibilitychange'));
  }

  it('should not call login function on visibility change with active token', () => {
    const authMock = { startSilentRenew: cy.stub(), stopSilentRenew: cy.stub(), user: { expires_at: Infinity } };
    const login = cy.stub();
    cy.mount(<DummyComponent authMock={authMock} login={login} />);
    cy.document().then((doc) => {
      expect(login).to.not.be.called;
      toggleDocumentVisibility(doc);
      expect(login).to.not.be.called;
    });
  });

  it('should call login function on visibility change with expired token', () => {
    const authMock = { startSilentRenew: cy.stub(), stopSilentRenew: cy.stub(), user: { expires_at: -1 } };
    const login = cy.stub();
    cy.mount(<DummyComponent authMock={authMock} login={login} />);
    cy.document().then((doc) => {
      expect(login).to.not.be.called;
      toggleDocumentVisibility(doc);
      expect(login).to.be.called;
    });
  });
});
