import React from 'react';
import { Button, Card, CardBody, CardFooter, CardTitle } from '@patternfly/react-core';
import { useTheme } from '../../../src/hooks/useTheme';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';

function DarkMode() {
  const { setLightMode, setDarkMode, setSystemMode } = useTheme();

  return (
    <>
      <Button variant="primary" size="lg" id="system-button" onClick={setSystemMode}>
        System
      </Button>
      <Button variant="primary" size="lg" id="light-button" onClick={setLightMode}>
        Light
      </Button>
      <Button variant="primary" size="lg" id="dark-button" onClick={setDarkMode}>
        Dark
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
        <DarkMode />
      </FeatureFlagsProvider>
    </ChromeAuthContext.Provider>
  );
}

describe('ThemeMenu Component', () => {
  describe('With system theme enabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.dark-mode',
            enabled: true,
            variant: { name: 'disabled', enabled: true },
          },
          {
            name: 'platform.chrome.dark-mode_system',
            enabled: true,
            variant: { name: 'disabled', enabled: true },
          },
        ],
      }).as('featureFlags');
    });

    describe('Initial State', () => {
      it('uses localStorage dark preference', () => {
        cy.setLocalStorage('chrome:theme', 'dark');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:theme').should('equal', 'dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('uses localStorage light preference', () => {
        cy.setLocalStorage('chrome:theme', 'light');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:theme').should('equal', 'light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('falls back to system dark preference', () => {
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:theme').should('equal', 'system');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('falls back to system light preference', () => {
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:theme').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
    });

    describe('User Interactions', () => {
      it('toggles from light to dark', () => {
        localStorage.setItem('chrome:theme', 'light');
        cy.mount(<Wrapper />).get('html');
        cy.get('#dark-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('toggles from dark to light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        cy.mount(<Wrapper />).get('html');
        cy.get('#light-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('toggles from dark to system light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('toggles from system light to dark', () => {
        localStorage.setItem('chrome:theme', 'system');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: false,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.getLocalStorage('chrome:theme').should('equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
        cy.get('#dark-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('toggles from light to system dark', () => {
        localStorage.setItem('chrome:theme', 'light');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'system');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('system button should be available', () => {
        cy.mount(<Wrapper />);
        cy.get('#system-button').should('exist').should('be.visible');
      });
    });
  });

  describe('With system theme disabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.dark-mode',
            enabled: true,
            variant: { name: 'disabled', enabled: true },
          },
          {
            name: 'platform.chrome.dark-mode_system',
            enabled: false,
            variant: { name: 'disabled', enabled: false },
          },
        ],
      }).as('featureFlagsNoSystem');
    });

    describe('Initial State', () => {
      it('uses localStorage dark preference', () => {
        cy.setLocalStorage('chrome:theme', 'dark');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsNoSystem');
        cy.getLocalStorage('chrome:theme').should('equal', 'dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });

      it('uses localStorage light preference', () => {
        cy.setLocalStorage('chrome:theme', 'light');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsNoSystem');
        cy.getLocalStorage('chrome:theme').should('equal', 'light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });

      it('defaults to light theme when no preference saved (not system)', () => {
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsNoSystem');
        // Should NOT save 'system' when flag is disabled
        cy.getLocalStorage('chrome:theme').should('not.equal', 'system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });

      it('ignores localStorage system preference and defaults to light', () => {
        cy.setLocalStorage('chrome:theme', 'system');
        cy.window().then((win) => {
          cy.stub(win, 'matchMedia').returns({
            matches: true,
            media: '(prefers-color-scheme: dark)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
          });
        });
        cy.mount(<Wrapper />).get('html');
        cy.wait('@featureFlagsNoSystem');
        // Should ignore saved 'system' preference and use light
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
    });

    describe('User Interactions', () => {
      it('toggles from light to dark', () => {
        localStorage.setItem('chrome:theme', 'light');
        cy.mount(<Wrapper />).get('html');
        cy.get('#dark-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });

      it('toggles from dark to light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        cy.mount(<Wrapper />).get('html');
        cy.get('#light-button').click();
        cy.getLocalStorage('chrome:theme').should('equal', 'light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
    });
  });
});
