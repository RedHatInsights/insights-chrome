describe('Landing page', () => {
  it('visit landing page', () => {
    cy.login();

    cy.visit('/');

    cy.intercept({
      method: 'GET',
      url: '**/services/services.json',
    }).as('services');

    cy.wait('@services').its('response.statusCode').should('equal', 200);

    // check if a favorites link exists on the page
    cy.contains('My favorite services').should('exist');
  });

  it('tooltip is shown when hovering over the gear/question icon', () => {
    cy.login();

    cy.visit('/');

    cy.intercept({
      method: 'GET',
      url: '**/services/services.json',
    }).as('services');

    cy.wait('@services').its('response.statusCode').should('equal', 200);

    cy.get('.tooltip-button-settings-cy').invoke('show').trigger('mouseenter').wait(1000);
    cy.get('.tooltip-inner-settings-cy').should('be.visible').and('contain', 'Settings');

    cy.get('.tooltip-button-help-cy').invoke('show').trigger('mouseenter').wait(1000);
    cy.get('.tooltip-inner-help-cy').should('be.visible').and('contain', 'Help');
  });
});
