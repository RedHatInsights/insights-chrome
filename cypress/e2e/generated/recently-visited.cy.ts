describe('Recently Visited Feature', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.title().then((title) => {
      cy.wrap(title).as('initialTitle');
    });
  });

  it('should verify recently visited feature', () => {
    cy.get('a').contains('RHEL').click({ force: true });
    cy.wait(5000);
    cy.title().then((title) => {
      cy.get('@initialTitle').then((initialTitle) => {
        cy.wrap([initialTitle, title]).as('visitedTitles');
      });
    });

    cy.get('#nav-toggle').click({ force: true });
    cy.contains('Inventory').click({ force: true });
    cy.contains('Systems').click({ force: true });
    cy.wait(5000);
    cy.title().then((title) => {
      cy.get('@visitedTitles').then((visitedTitles) => {
        cy.wrap([...visitedTitles, title]).as('visitedTitles');
      });
    });

    cy.get('table tr:first-child a').click({ force: true });
    cy.wait(5000);
    cy.title().then((title) => {
      cy.get('@visitedTitles').then((visitedTitles) => {
        cy.wrap([...visitedTitles, title]).as('visitedTitles');
      });
    });

    cy.get("header img[alt='Red Hat Logo']").click({ force: true });

    cy.get<string[]>('@visitedTitles').then((visitedTitles) => {
      visitedTitles.forEach((title) => {
        cy.contains(title).scrollIntoView().should('be.visible');
      });
    });
  });
});

Cypress.config('defaultCommandTimeout', 60000);
