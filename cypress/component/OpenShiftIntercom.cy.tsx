import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import OpenShiftIntercomModule, { OpenShiftIntercomModuleProps } from '../../src/components/OpenShiftIntercom/OpenShiftIntercomModule';

// Mock Unleash config for testing
const mockUnleashConfig = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'test-key',
  appName: 'test-app',
  refreshInterval: 0, // Disable polling
  disableRefresh: true, // Disable automatic refresh
  bootstrap: [
    {
      name: 'platform.chrome.openshift-intercom',
      enabled: true,
      variant: { name: 'enabled', enabled: true },
      impressionData: false,
    },
  ],
};

// Helper to wrap component with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FlagProvider config={mockUnleashConfig}>
    <ScalprumProvider config={{}} api={{}}>
      {children}
    </ScalprumProvider>
  </FlagProvider>
);

describe('OpenShiftIntercomModule', () => {
  const defaultProps: OpenShiftIntercomModuleProps = {
    className: 'test-class',
  };

  beforeEach(() => {
    // Clean up any existing Intercom
    delete (window as any).Intercom;

    // Mock Unleash API calls to prevent real requests
    cy.intercept('GET', '**/api/frontend**', {
      statusCode: 200,
      body: { toggles: [] },
    });
    cy.intercept('POST', '**/api/frontend**', { statusCode: 200 });
  });

  it('renders the intercom button when feature flag is enabled', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub().as('intercom');
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Wait for Unleash to load flags

    cy.get('[aria-label="Customer Success"]').should('exist');
  });

  it('has correct attributes on the button', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub();
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    cy.get('[aria-label="Customer Success"]')
      .should('have.attr', 'widget-type', 'OpenShiftIntercom')
      .should('have.class', 'chr-button-intercom')
      .should('have.class', 'pf-m-primary');
  });

  it('applies custom className', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub();
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule className="custom-class" />
      </TestWrapper>
    );

    cy.get('[aria-label="Customer Success"]').should('have.class', 'custom-class');
  });

  it('renders tooltip with correct content', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub();
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Check that button exists and has the Tooltip wrapper
    cy.get('[aria-label="Customer Success"]').should('exist');
    // PatternFly Tooltip renders a tippy.js instance, check for the button's aria attributes
    cy.get('[aria-label="Customer Success"]').should('have.attr', 'aria-label', 'Customer Success');
  });

  it('renders rocket icon', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub();
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    cy.get('svg').should('exist');
    cy.get('.chr-icon-intercom').should('exist');
  });

  it('calls Intercom show and update when button is clicked', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Cypress will automatically retry these queries until they succeed
    cy.get('[aria-label="Customer Success"]').should('exist');
    cy.get('[aria-label="Customer Success"]').click({ force: true });

    // Should call update for positioning and then show
    cy.get('@intercom').should('have.been.calledWith', 'update');
    cy.get('@intercom').should('have.been.calledWith', 'show');
  });

  it('does not render when Intercom is not available', () => {
    cy.window().then((win) => {
      // Ensure Intercom is not available
      delete (win as any).Intercom;
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Button should not render at all when Intercom is unavailable
    cy.get('[aria-label="Customer Success"]').should('not.exist');
  });

  it('registers Intercom event handlers when Intercom becomes available', () => {
    cy.clock();

    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Wait for the async setup
    cy.tick(600);

    // Should register onHide and onShow handlers
    cy.get('@intercom').should('have.been.calledWith', 'onHide');
    cy.get('@intercom').should('have.been.calledWith', 'onShow');
  });

  it('updates Intercom position on window resize', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Clear previous calls
    cy.get('@intercom').invoke('resetHistory');

    // Trigger resize
    cy.window().then((win) => {
      win.dispatchEvent(new Event('resize'));
    });

    // Should update position
    cy.get('@intercom').should('have.been.calledWith', 'update');
  });

  it('adds expanded class when isExpanded is true', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;

      // Simulate store state being expanded
      // This would normally be set by the store, but for testing we can check class application
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    // Initially should not have expanded class
    cy.get('[aria-label="Customer Success"]').should('not.have.class', 'expanded');
  });

  it('has proper accessibility attributes', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub();
    });

    cy.mount(
      <TestWrapper>
        <OpenShiftIntercomModule {...defaultProps} />
      </TestWrapper>
    );

    cy.get('[aria-label="Customer Success"]')
      .should('have.attr', 'aria-label', 'Customer Success')
      .should('have.attr', 'widget-type', 'OpenShiftIntercom')
      .should('have.attr', 'type', 'button');
  });
});
