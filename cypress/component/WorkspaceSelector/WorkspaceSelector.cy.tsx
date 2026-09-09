import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { FlagProvider } from '@unleash/proxy-client-react';
import { IntlProvider } from 'react-intl';
import WorkspaceSelector from '../../../src/components/WorkspaceSelector/WorkspaceSelector';
import chromeStore from '../../../src/state/chromeStore';

const mockUnleashConfig = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'test-key',
  appName: 'test-app',
  refreshInterval: 0,
  disableRefresh: true,
  bootstrap: [
    {
      name: 'platform.chrome.workspace-global_selector',
      enabled: false,
      variant: { name: 'disabled', enabled: false },
      impressionData: false,
    },
  ],
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en">
    <FlagProvider config={mockUnleashConfig}>
      <JotaiProvider store={chromeStore}>{children}</JotaiProvider>
    </FlagProvider>
  </IntlProvider>
);

describe('WorkspaceSelector', () => {
  it('should not render when feature flag is disabled', () => {
    cy.mount(
      <Wrapper>
        <WorkspaceSelector />
      </Wrapper>
    );
    cy.get('[data-testid="workspace-selector"]').should('not.exist');
  });
});
