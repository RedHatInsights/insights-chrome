import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import AllServicesTabs from '../../../src/components/AllServicesDropdown/AllServicesTabs';
import { isPreviewAtom } from '../../../src/state/atoms/releaseAtom';
import { FAVORITE_TAB_ID } from '../../../src/components/AllServicesDropdown/common';
import type { AllServicesSection } from '../../../src/components/AllServices/allServicesLinks';

// Must exceed the component's 300ms hover-to-activate delay.
const HOVER_SETTLE_MS = 400;

const mockLinkSections: AllServicesSection[] = [
  {
    id: 'openshift',
    title: 'OpenShift',
    description: 'OpenShift platform services',
    links: [],
  },
];

const favTab = () => cy.get('[role="tab"]').contains('My Favorite services');

const mountTabs = (previewMode: boolean) => {
  const handleTabClick = cy.stub().as('handleTabClick');
  const store = createStore();
  store.set(isPreviewAtom, previewMode);

  cy.mount(
    // @ts-expect-error ChromeAuthContext.Provider value is intentionally partial in tests
    <ChromeAuthContext.Provider value={{ user: { identity: { user: {}, internal: {} } } }}>
      <MemoryRouter>
        <JotaiProvider store={store}>
          <FeatureFlagsProvider>
            <AllServicesTabs
              activeTabKey={FAVORITE_TAB_ID}
              handleTabClick={handleTabClick}
              isExpanded={false}
              onToggle={() => {}}
              linkSections={mockLinkSections}
              tabContentRef={React.createRef()}
              onTabClick={() => {}}
              activeTabTitle="Favorites"
              setIsExpanded={() => {}}
            />
          </FeatureFlagsProvider>
        </JotaiProvider>
      </MemoryRouter>
    </ChromeAuthContext.Provider>
  );
};

describe('<AllServicesTabs />', () => {
  describe('TabWrapper hover behavior', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/featureflags/*', { toggles: [] });
      cy.intercept('POST', '/api/chrome-service/v1/user/update-ui-preview', {});
    });

    it('should activate the tab when hovered for 300ms in preview mode', () => {
      mountTabs(true);

      favTab().trigger('mouseover', { force: true });

      cy.get('@handleTabClick').should('have.been.called');
    });

    it('should not activate the tab when hovered outside preview mode', () => {
      mountTabs(false);

      favTab().trigger('mouseover', { force: true });
      cy.wait(HOVER_SETTLE_MS);

      cy.get('@handleTabClick').should('not.have.been.called');
    });

    it('should cancel activation when mouse leaves before 300ms', () => {
      mountTabs(true);

      favTab().trigger('mouseover', { force: true });
      favTab().trigger('mouseout', { force: true });
      cy.wait(HOVER_SETTLE_MS);

      cy.get('@handleTabClick').should('not.have.been.called');
    });
  });
});
