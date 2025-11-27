// Landing page has changed
describe('Landing page', () => {
  it('visit landing page', () => {
    cy.login();

    cy.visit('/');

    // check if a favorites link exists on the page
    cy.contains('My favorite services').should('exist');
  });

  it('tooltip is shown when hovering over the gear/question icon', () => {
    cy.login();

    cy.visit('/');

    // Wait for the settings tooltip button to be present before interacting
    cy.get('.tooltip-button-settings-cy').should('exist').invoke('show').trigger('mouseenter');
    cy.get('.tooltip-inner-settings-cy').should('be.visible').and('contain', 'Settings');

    cy.get('.tooltip-button-help-cy').should('exist').invoke('show').trigger('mouseenter');
    cy.get('.tooltip-inner-help-cy')
      .should('be.visible')
      .and('contain', 'Learning resources, API documentation, Support Case Management, Ask Red Hat assistant, and more.');
  });
});
