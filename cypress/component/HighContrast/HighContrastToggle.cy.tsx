import React from 'react';
import { Button, Card, CardBody, CardFooter, CardTitle } from '@patternfly/react-core';
import { useHighContrast } from '../../../src/hooks/useHighContrast';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';

function HighContrast() {
  const { setSystemContrast, setDefaultContrast, setHighContrast } = useHighContrast();

  return (
    <>
      <Button variant="primary" size="lg" id="system-button" onClick={setSystemContrast}>
        System
      </Button>
      <Button variant="primary" size="lg" id="default-button" onClick={setDefaultContrast}>
        Default
      </Button>
      <Button variant="primary" size="lg" id="high-button" onClick={setHighContrast}>
        High contrast
      </Button>
      <Card>
        <CardTitle component="h4">Title within an {'<h4>'} element</CardTitle>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
      <Card>
        <CardTitle component="h4">Title within an {'<h4>'} element</CardTitle>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    </>
  );
}

function Wrapper() {
  return (
    <ChromeAuthContext.Provider
      value={
        {
          user: {
            identity: {
              user: { email: 'test@example.com' },
              account_number: '123456',
              internal: { account_id: '13579', org_id: '7890' },
            },
          },
        } as any
      }
    >
      <FeatureFlagsProvider>
        <HighContrast />
      </FeatureFlagsProvider>
    </ChromeAuthContext.Provider>
  );
}

describe('HighContrastToggle Component', () => {
  describe('With high contrast enabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.high-contrast',
            enabled: true,
            variant: { name: 'disabled', enabled: true },
          },
        ],
      }).as('featureFlags');
    });

    describe('Initial State', () => {
      it('uses localStorage high preference', () => {
        cy.setLocalStorage('chrome:high-contrast', 'high');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'high');
        cy.get('html').should('have.class', 'pf-v6-theme-high-contrast');
      });

      it('uses localStorage default preference', () => {
        cy.setLocalStorage('chrome:high-contrast', 'default');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'default');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });

      it('falls back to system with high contrast preference', () => {
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'system');
        cy.get('html').should('have.class', 'pf-v6-theme-high-contrast');
      });

      it('falls back to system with no contrast preference', () => {
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });
    });

    describe('User Interactions', () => {
      it('toggles from default to high', () => {
        localStorage.setItem('chrome:high-contrast', 'default');
        cy.mount(<Wrapper />).get('html');
        cy.get('#high-button').click();
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'high');
        cy.get('html').should('have.class', 'pf-v6-theme-high-contrast');
      });

      it('toggles from high to default', () => {
        localStorage.setItem('chrome:high-contrast', 'high');
        cy.mount(<Wrapper />).get('html');
        cy.get('#default-button').click();
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'default');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });

      it('toggles from high to system without contrast preference', () => {
        localStorage.setItem('chrome:high-contrast', 'high');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });

      it('toggles from system to high', () => {
        localStorage.setItem('chrome:high-contrast', 'system');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
        cy.get('#high-button').click();
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'high');
        cy.get('html').should('have.class', 'pf-v6-theme-high-contrast');
      });

      it('toggles from default to system with contrast preference', () => {
        localStorage.setItem('chrome:high-contrast', 'default');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        cy.getLocalStorage('chrome:high-contrast').should('equal', 'system');
        cy.get('html').should('have.class', 'pf-v6-theme-high-contrast');
      });

      it('system button should be available', () => {
        cy.mount(<Wrapper />);
        cy.get('#system-button').should('exist').should('be.visible');
      });
    });
  });

  describe('With high contrast disabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.high-contrast',
            enabled: false,
            variant: { name: 'disabled', enabled: false },
          },
        ],
      }).as('featureFlagsDisabled');
    });

    describe('Initial State', () => {
      it('ignores localStorage high preference', () => {
        cy.setLocalStorage('chrome:high-contrast', 'high');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsDisabled');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });

      it('ignores localStorage system preference', () => {
        cy.setLocalStorage('chrome:high-contrast', 'system');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-contrast: more)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsDisabled');
        cy.get('html').should('not.have.class', 'pf-v6-theme-high-contrast');
      });
    });
  });
});
