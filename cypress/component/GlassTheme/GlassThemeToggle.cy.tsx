import React from 'react';
import { Card, CardBody, CardFooter, CardTitle, Switch } from '@patternfly/react-core';
import { useGlassTheme } from '../../../src/hooks/useGlassTheme';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';
import { useFlag } from '@unleash/proxy-client-react';

function GlassTheme() {
  const isGlassModeEnabled = useFlag('platform.chrome.glass-theme');
  const { isGlassTheme, toggleGlassTheme } = useGlassTheme(isGlassModeEnabled);

  return (
    <>
      {isGlassModeEnabled && <Switch id="glass-theme-switch" label="Frosted glass effect" isChecked={isGlassTheme} hasCheckIcon onChange={toggleGlassTheme} />}
      <Card>
        <CardTitle component="h4">Glass theme test card</CardTitle>
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
        <GlassTheme />
      </FeatureFlagsProvider>
    </ChromeAuthContext.Provider>
  );
}

describe('GlassTheme Component', () => {
  describe('With glass theme flag enabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.glass-theme',
            enabled: true,
            variant: { name: 'disabled', enabled: true },
          },
        ],
      }).as('featureFlags');
    });

    describe('Initial State', () => {
      it('defaults to glass off when no preference saved', () => {
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('html').should('not.have.class', 'pf-v6-theme-glass');
      });

      it('restores glass on from localStorage', () => {
        cy.setLocalStorage('chrome:glass-theme', 'true');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('html').should('have.class', 'pf-v6-theme-glass');
      });

      it('restores glass off from localStorage', () => {
        cy.setLocalStorage('chrome:glass-theme', 'false');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('html').should('not.have.class', 'pf-v6-theme-glass');
      });

      it('renders the switch toggle', () => {
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('.pf-v6-c-switch').should('exist').should('be.visible');
      });
    });

    describe('User Interactions', () => {
      it('toggles glass on', () => {
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('.pf-v6-c-switch').click();
        cy.get('html').should('have.class', 'pf-v6-theme-glass');
        cy.getLocalStorage('chrome:glass-theme').should('equal', 'true');
      });

      it('toggles glass off', () => {
        cy.setLocalStorage('chrome:glass-theme', 'true');
        cy.mount(<Wrapper />);
        cy.wait('@featureFlags');
        cy.get('.pf-v6-c-switch').click();
        cy.get('html').should('not.have.class', 'pf-v6-theme-glass');
        cy.getLocalStorage('chrome:glass-theme').should('equal', 'false');
      });
    });
  });

  describe('With glass theme flag disabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', {
        toggles: [
          {
            name: 'platform.chrome.glass-theme',
            enabled: false,
            variant: { name: 'disabled', enabled: false },
          },
        ],
      }).as('featureFlagsDisabled');
    });

    it('does not render the switch', () => {
      cy.mount(<Wrapper />);
      cy.wait('@featureFlagsDisabled');
      cy.get('.pf-v6-c-switch').should('not.exist');
    });

    it('removes glass class even if localStorage has it enabled', () => {
      cy.setLocalStorage('chrome:glass-theme', 'true');
      cy.mount(<Wrapper />);
      cy.wait('@featureFlagsDisabled');
      cy.get('html').should('not.have.class', 'pf-v6-theme-glass');
    });
  });
});
