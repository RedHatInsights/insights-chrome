describe('Navigation', () => {
  beforeEach('', () => {
    cy.login();
    cy.visit('/');
  });

  it('visit services', () => {
    // click on services button
    cy.get('.chr-c-link-service-toggle').click();
  });

  it('Navigate to users', () => {
    // click on services button
    cy.get('.chr-c-link-service-toggle').click();

    // check if favorite services links exist
    cy.contains('.pf-v5-c-tabs__link', 'My favorite services');

    // click on all services
    cy.get('.chr-l-flex__item-browse-all-services a').click();

    // get users link
    cy.get('p:contains("Users")').click();
  });
});
