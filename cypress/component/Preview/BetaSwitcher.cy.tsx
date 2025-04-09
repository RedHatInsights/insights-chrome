import React, { PropsWithChildren } from 'react';
import { Provider, createStore, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import BetaSwitcher from '../../../src/components/BetaSwitcher';
import { userConfigAtom } from '../../../src/state/atoms/userConfigAtom';
import { ChromeUserConfig } from '../../../src/utils/initUserConfig';
import { isPreviewAtom } from '../../../src/state/atoms/releaseAtom';

const HydrateAtoms = ({ initialValues, children }: PropsWithChildren<{ initialValues: any }>) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children }: PropsWithChildren<{ initialValues: any }>) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

const Wrapper = () => {
  return <BetaSwitcher />;
};

describe('BetaSwitcher', () => {
  it('should show preview modal on first user preview toggle', () => {
    const userConfig: ChromeUserConfig = {
      data: {
        uiPreview: false,
        uiPreviewSeen: false,
      },
    } as ChromeUserConfig;
    cy.intercept('POST', 'api/chrome-service/v1/user/mark-preview-seen', {
      data: {
        uiPreview: true,
        uiPreviewSeen: true,
      },
    });
    cy.mount(
      <TestProvider
        initialValues={[
          [userConfigAtom, userConfig],
          [isPreviewAtom, false],
        ]}
      >
        <Wrapper />
      </TestProvider>
    );

    cy.contains('turn on Preview mode').should('exist');

    cy.get('#preview-toggle').click();
    cy.contains('Turn on').should('exist');
    cy.contains('Turn on').click();
    cy.wait(5000);
    cy.contains('turn off Preview mode').should('exist');

    // turn off preview again
    cy.get('#preview-toggle').click();
    cy.contains('turn on Preview mode').should('exist');
  });

  it('should not show preview modal on subsequent user preview toggles', () => {
    const userConfig: ChromeUserConfig = {
      data: {
        uiPreview: false,
        uiPreviewSeen: true,
      },
    } as ChromeUserConfig;
    cy.mount(
      <TestProvider
        initialValues={[
          [userConfigAtom, userConfig],
          [isPreviewAtom, false],
        ]}
      >
        <Wrapper />
      </TestProvider>
    );

    cy.contains('turn on Preview mode').should('exist');
    cy.contains('Turn on').should('not.exist');

    cy.get('#preview-toggle').click();
    cy.contains('turn off Preview mode').should('exist');

    // turn off preview again
    cy.get('#preview-toggle').click();
    cy.contains('turn on Preview mode').should('exist');
  });

  it('should hide the entire banner in stable environment, but show in preview', () => {
    const FakePreviewToggle = () => {
      const togglePreview = useSetAtom(isPreviewAtom);
      return <button onClick={() => togglePreview()}>Fake</button>;
    };
    const userConfig: ChromeUserConfig = {
      data: {
        uiPreview: false,
        uiPreviewSeen: true,
      },
    } as ChromeUserConfig;
    const store = createStore();
    store.set(isPreviewAtom, false);
    cy.mount(
      <TestProvider
        initialValues={[
          [userConfigAtom, userConfig],
          [isPreviewAtom, false],
        ]}
      >
        <Wrapper />
        <FakePreviewToggle />
      </TestProvider>
    );

    // if the node is turned off immediately it sometimes doesn't render the banner and the test fails
    cy.wait(1000);
    cy.get('.pf-v6-c-menu-toggle').click();
    cy.get('.pf-v6-c-menu__item-text').should('exist');
    cy.get('.pf-v6-c-menu__item-text').click();
    cy.get('.pf-v6-c-menu-toggle').should('not.exist');

    // turn preview and banner should show
    cy.contains('Fake').click();
  });
});
