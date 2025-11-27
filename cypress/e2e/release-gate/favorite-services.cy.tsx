describe('Favorite Services (E2E User Flow)', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.get('button').contains('first_name last_name').should('be.visible');
  });

  it('should favorite on the page and unfavorite from the header dropdown', () => {
    const serviceToTest = 'ACS Instances';
    const serviceRowSelector = '.pf-v6-l-flex';
    const quickstartIdSelector = '[data-quickstart-id="openshift_acs_instances"]';

    cy.intercept('POST', '**/api/chrome-service/v1/favorite-pages').as('favoriteRequest');

    cy.visit('/allservices');
    cy.contains(serviceToTest).should('be.visible');

    // 3. Favorite a specific service on the page
    cy.contains(serviceToTest).closest(serviceRowSelector).find('[data-ouia-component-id*="FavoriteToggle"]').click();

    // Wait for the API call to complete
    cy.wait('@favoriteRequest').its('response.statusCode').should('be.oneOf', [200, 201]);

    // 4. Open the All Services drop-down menu
    cy.get('[data-ouia-component-id="AllServices-DropdownToggle"]').click();

    // 5. Confirm that the favorited service appears in the dropdown
    cy.log('Verifying favorite appears in dropdown');
    cy.get('.pf-v6-c-sidebar__content')
      .should('be.visible')
      .within(() => {
        cy.get(quickstartIdSelector).should('exist').find('.chr-c-icon-star').should('be.visible');

        // 6. Un-favorite the service from the All Services drop-down
        cy.get(quickstartIdSelector).find('button').click();
      });

    cy.wait('@favoriteRequest');

    // Assert that the service is no longer in the favorites dropdown
    cy.get('.pf-v6-c-sidebar__content').within(() => {
      cy.get(quickstartIdSelector).should('not.exist');
    });

    // 7. Close the drop-down menu
    cy.get('[data-ouia-component-id="AllServices-DropdownToggle"]').click();

    // 8. On the all-services page, confirm the service is no longer favorited
    cy.contains(serviceToTest).closest(serviceRowSelector).find('.chr-c-favorite-trigger').should('not.have.class', 'chr-c-icon-favorited');
  });
});
