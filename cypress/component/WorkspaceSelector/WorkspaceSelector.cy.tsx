import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { IntlProvider } from 'react-intl';
import WorkspaceSelector from '../../../src/components/WorkspaceSelector/WorkspaceSelector';
import chromeStore from '../../../src/state/chromeStore';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en">
    <JotaiProvider store={chromeStore}>{children}</JotaiProvider>
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
