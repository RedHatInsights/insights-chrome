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

function stubMatchMedia(prefersDark: boolean) {
  cy.window().then((win) => {
    cy.stub(win, 'matchMedia').callsFake((query: string) => ({
      matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
      media: query,
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      addListener: cy.stub(),
      removeListener: cy.stub(),
      dispatchEvent: cy.stub(),
      onchange: null,
    }));
  });
}

/** Retrying localStorage assertion — cy.getLocalStorage does not retry while flags hydrate. */
function expectTheme(value: string) {
  cy.window().its('localStorage').invoke('getItem', 'chrome:theme').should('equal', value);
}

describe('ThemeMenu Component', () => {
  describe('With system theme enabled', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.removeItem('chrome:theme');
        win.document.documentElement.classList.remove('pf-v6-theme-dark');
      });
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
        expectTheme('dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('uses localStorage light preference', () => {
        cy.setLocalStorage('chrome:theme', 'light');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        expectTheme('light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('falls back to system dark preference', () => {
        stubMatchMedia(true);
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        // Assert class first — retries until Unleash flags hydrate and theme applies
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
        expectTheme('system');
      });
      it('falls back to system light preference', () => {
        stubMatchMedia(false);
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
        expectTheme('system');
      });
    });

    describe('User Interactions', () => {
      it('toggles from light to dark', () => {
        localStorage.setItem('chrome:theme', 'light');
        cy.mount(<Wrapper />).get('html');
        cy.get('#dark-button').click();
        expectTheme('dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('toggles from dark to light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        cy.mount(<Wrapper />).get('html');
        cy.get('#light-button').click();
        expectTheme('light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('toggles from dark to system light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        stubMatchMedia(false);
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        expectTheme('system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
      it('toggles from system light to dark', () => {
        localStorage.setItem('chrome:theme', 'system');
        stubMatchMedia(false);
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        expectTheme('system');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
        cy.get('#dark-button').click();
        expectTheme('dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });
      it('toggles from light to system dark', () => {
        localStorage.setItem('chrome:theme', 'light');
        stubMatchMedia(true);
        cy.mount(<Wrapper />).get('html');
        cy.get('#system-button').click();
        expectTheme('system');
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
      cy.window().then((win) => {
        win.localStorage.removeItem('chrome:theme');
        win.document.documentElement.classList.remove('pf-v6-theme-dark');
      });
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
        expectTheme('dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });

      it('uses localStorage light preference', () => {
        cy.setLocalStorage('chrome:theme', 'light');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsNoSystem');
        expectTheme('light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });

      it('defaults to light theme when no preference saved (not system)', () => {
        stubMatchMedia(true);
        cy.mount(<Wrapper />);
        cy.wait('@featureFlagsNoSystem');
        // Should NOT save 'system' when flag is disabled
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
        cy.window().its('localStorage').invoke('getItem', 'chrome:theme').should('not.equal', 'system');
      });

      it('ignores localStorage system preference and defaults to light', () => {
        cy.setLocalStorage('chrome:theme', 'system');
        stubMatchMedia(true);
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
        expectTheme('dark');
        cy.get('html').should('have.class', 'pf-v6-theme-dark');
      });

      it('toggles from dark to light', () => {
        localStorage.setItem('chrome:theme', 'dark');
        cy.mount(<Wrapper />).get('html');
        cy.get('#light-button').click();
        expectTheme('light');
        cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
      });
    });
  });
});
