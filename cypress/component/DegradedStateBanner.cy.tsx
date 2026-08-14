import React from 'react';
import DegradedStateBanner from '../../src/components/DegradedStateBanner/DegradedStateBanner';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import { degradedStateAtom } from '../../src/state/atoms/degradedStateAtom';

describe('DegradedStateBanner', () => {
  it('should not render when all services healthy', () => {
    const store = createStore();

    cy.mount(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    cy.get('div[class*="pf-"]').should('not.exist');
  });

  it('should render banner with single degraded service', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    cy.contains('user preferences').should('be.visible');
    cy.contains('Core functionality is available').should('be.visible');
  });

  it('should render banner with multiple degraded services', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    cy.contains('user preferences').should('be.visible');
    cy.contains('entitlements').should('be.visible');
  });

  it('should always show warning variant', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    cy.get('.pf-m-warning').should('exist');
  });

  it('should list all degraded services', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: true,
      featureFlags: true,
    });

    cy.mount(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    cy.contains('user preferences').should('be.visible');
    cy.contains('entitlements').should('be.visible');
    cy.contains('navigation configuration').should('be.visible');
    cy.contains('feature flags').should('be.visible');
  });
});
