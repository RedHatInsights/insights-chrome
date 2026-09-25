import { clearVisibilityTestState, expectHealthyShell, mountScenario, seedFeatureFlagCache } from './helpers/DegradedVisibilityHarness';

describe('Unleash failure semantics', () => {
  beforeEach(clearVisibilityTestState);

  it('keeps Chrome rendered and treats uncached flags as disabled after a 503', () => {
    seedFeatureFlagCache([{ name: 'platform.chrome.consume-feo', enabled: true }]);
    cy.mount(mountScenario());
    cy.wait('@featureFlags').its('response.statusCode').should('eq', 503);

    expectHealthyShell();
    cy.get('[data-testid="feature-flags-health"]').should('have.attr', 'data-degraded', 'true');
    cy.get('[data-testid="visibility-state"]').should('have.attr', 'data-item-count', '2').and('have.attr', 'data-item-titles', 'Always visible|Flag disabled');
  });

  it('evaluates the cached toggle values during a 503', () => {
    seedFeatureFlagCache([
      { name: 'platform.chrome.consume-feo', enabled: true },
      { name: 'test.enabled', enabled: true, variant: { name: 'enabled', enabled: true }, impressionData: false },
      { name: 'test.disabled', enabled: true, variant: { name: 'enabled', enabled: true }, impressionData: false },
    ]);

    cy.mount(mountScenario());
    cy.wait('@featureFlags').its('response.statusCode').should('eq', 503);

    expectHealthyShell();
    cy.get('[data-testid="feature-flags-health"]').should('have.attr', 'data-degraded', 'true');
    cy.get('[data-testid="visibility-state"]').should('have.attr', 'data-item-titles', 'Always visible|Flag enabled');
  });

  it('ignores toggles cached for another user during a 503', () => {
    seedFeatureFlagCache([{ name: 'platform.chrome.consume-feo', enabled: true }]);
    cy.window().then((win) => {
      win.localStorage.setItem(
        'unleash:repository:other-org:other-user:repo',
        JSON.stringify([
          { name: 'platform.chrome.consume-feo', enabled: true },
          { name: 'test.enabled', enabled: true, variant: { name: 'enabled', enabled: true }, impressionData: false },
          { name: 'test.disabled', enabled: true, variant: { name: 'enabled', enabled: true }, impressionData: false },
        ])
      );
    });

    cy.mount(mountScenario());
    cy.wait('@featureFlags').its('response.statusCode').should('eq', 503);

    expectHealthyShell();
    cy.get('[data-testid="visibility-state"]').should('have.attr', 'data-item-titles', 'Always visible|Flag disabled');
  });
});
