describe('RBAC Group Creation and Deletion', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should create and delete an rbac group', () => {
    cy.visit('/iam/user-access/groups');
    cy.get('button:contains("Create group")').click({ force: true });
    cy.get('input[aria-label="Group name"]').type('platex-services', { force: true });
    cy.wait(5000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(5000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.get('button:contains("Next")').click({ force: true });
    cy.get('button:contains("Submit")').click({ force: true });
    cy.get('button:contains("Exit")').click({ force: true });
    cy.get('input[id="filter-by-string"]').type('platex-services', { force: true });
    cy.wait(5000);
    cy.get('button[aria-label="Kebab toggle"]').click({ force: true });
    cy.get('button:contains("Delete")').click({ force: true });
    cy.get('label:contains("I understand that this action cannot be undone.")').click({ force: true });
    cy.get('button:contains("Delete group")').click({ force: true });
    cy.wait(5000);
    cy.get('input[id="filter-by-string"]').type('platex-services', { force: true });
    cy.wait(5000);
    cy.get('a:contains("platex-services")').should('not.exist');
  });
});

beforeEach(() => {
  Cypress.config('defaultCommandTimeout', 60000);
});
