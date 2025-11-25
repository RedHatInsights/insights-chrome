/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import { Provider } from 'jotai';
import OpenShiftIntercomModule from '../../src/components/OpenShiftIntercom/OpenShiftIntercomModule';

describe('OpenShiftIntercomModule Integration', () => {
  beforeEach(() => {
    // Clean up any existing Intercom
    delete (window as any).Intercom;
    
    // Set up console spies
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
      cy.stub(win.console, 'warn').as('consoleWarn');
    });
  });

  it('works with Jotai Provider', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule />
      </Provider>
    );
    
    cy.get('[aria-label="Customer Success"]')
      .should('exist')
      .click();
      
    // Should warn since no Intercom is available in test
    cy.get('@consoleWarn').should('have.been.calledWith', 'Intercom widget not available. Using fallback toggle.');
  });

  it('handles state changes through atom updates', () => {
    const TestComponent = () => {
      const [localExpanded, setLocalExpanded] = React.useState(false);
      
      return (
        <Provider>
          <OpenShiftIntercomModule />
          <button 
            data-testid="external-toggle" 
            onClick={() => setLocalExpanded(!localExpanded)}
          >
            External Toggle
          </button>
          <div data-testid="state-display">{localExpanded ? 'expanded' : 'collapsed'}</div>
        </Provider>
      );
    };

    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(<TestComponent />);
    
    // Click the intercom button - should call show 
    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@intercom').should('have.been.calledWith', 'show');
  });

  it('integrates with Chrome feature flags', () => {
    cy.window().then((win) => {
      // Mock Chrome feature flag
      (win as any).insights = {
        chrome: {
          isBeta: () => true,
          getEnvironment: () => 'test'
        }
      };
    });
    
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule 
          className="feature-enabled"
        />
      </Provider>
    );
    
    cy.get('.feature-enabled').should('exist');
    cy.get('[aria-label="Customer Success"]').should('be.visible');
  });

  it('handles federated module context', () => {
    cy.window().then((win) => {
      // Mock federated module environment
      (win as any).__webpack_require__ = {
        cache: {},
        modules: {}
      };
    });
    
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule />
      </Provider>
    );
    
    cy.get('[aria-label="Customer Success"]').should('exist');
  });

  it('maintains component performance with multiple renders', () => {
    const TestComponent = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <Provider>
          <OpenShiftIntercomModule />
          <button 
            data-testid="render-trigger" 
            onClick={() => setCount(count + 1)}
          >
            Render {count}
          </button>
        </Provider>
      );
    };

    cy.mount(<TestComponent />);
    
    // Trigger multiple re-renders
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="render-trigger"]').click();
    }
    
    // Component should still be responsive
    cy.get('[aria-label="Customer Success"]').should('be.visible');
    cy.contains('Render 5').should('exist');
  });

  it('works correctly when Intercom loads asynchronously', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule />
      </Provider>
    );
    
    // Initially no Intercom - should use fallback
    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@consoleWarn').should('have.been.calledWith', 'Intercom widget not available. Using fallback toggle.');
    
    // Simulate Intercom loading
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercomLater');
      win.Intercom = mockIntercom;
    });
    
    // Now should use Intercom directly
    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@intercomLater').should('have.been.calledWith', 'show');
  });
});
