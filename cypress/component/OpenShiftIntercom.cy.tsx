import React from 'react';
import { Provider } from 'jotai';
import OpenShiftIntercomModule, { OpenShiftIntercomModuleProps } from '../../src/components/OpenShiftIntercom/OpenShiftIntercomModule';

describe('OpenShiftIntercomModule', () => {
  const defaultProps: OpenShiftIntercomModuleProps = {
    className: 'test-class',
  };

  beforeEach(() => {
    // Clean up any existing Intercom
    delete (window as any).Intercom;

    // Set up console spies
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
      cy.stub(win.console, 'warn').as('consoleWarn');
    });
  });

  it('renders the intercom button with correct attributes', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]')
      .should('exist')
      .should('have.attr', 'widget-type', 'OpenShiftIntercom')
      .should('have.class', 'chr-c-toolbar__button-intercom');
  });

  it('renders with tooltip', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').trigger('mouseenter');
    cy.contains('Customer Success').should('be.visible');
  });

  it('applies custom className', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} className="custom-class" />
      </Provider>
    );

    cy.get('.custom-class').should('exist');
  });

  it('calls Intercom show when button is clicked', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@intercom').should('have.been.calledWith', 'show');
  });

  it('calls Intercom show/hide based on internal state', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    // First click - should show (internal state starts as false)
    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@intercom').should('have.been.calledWith', 'show');

    // Second click - should hide (internal state is now true)
    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@intercom').should('have.been.calledWith', 'hide');
  });

  it('uses fallback when Intercom is not available', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@consoleWarn').should('have.been.calledWith', 'Intercom widget not available. Using fallback toggle.');
  });

  it('handles Intercom errors gracefully', () => {
    cy.window().then((win) => {
      win.Intercom = cy.stub().throws(new Error('Intercom error'));
    });

    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').click();
    cy.get('@consoleWarn').should('have.been.calledWith', 'Intercom widget not available. Using fallback toggle.');
  });

  it('has proper accessibility attributes', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').should('have.attr', 'aria-label', 'Customer Success').should('have.attr', 'widget-type', 'OpenShiftIntercom');
  });

  it('renders rocket icon', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('svg').should('exist');
  });

  it('button variant is primary', () => {
    cy.mount(
      <Provider>
        <OpenShiftIntercomModule {...defaultProps} />
      </Provider>
    );

    cy.get('button').should('have.class', 'pf-m-primary');
  });

  it('works without external props (self-contained mode)', () => {
    cy.window().then((win) => {
      const mockIntercom = cy.stub().as('intercom');
      win.Intercom = mockIntercom;
    });

    cy.mount(
      <Provider>
        <OpenShiftIntercomModule className="self-contained-test" />
      </Provider>
    );

    cy.get('[aria-label="Customer Success"]').should('exist').should('have.class', 'chr-c-toolbar__button-intercom').click();

    // Should call Intercom('show') on first click since internal state starts as false
    cy.get('@intercom').should('have.been.calledWith', 'show');
  });
});
