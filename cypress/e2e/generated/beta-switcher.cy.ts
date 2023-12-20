describe('Test beta switcher toggle functionality', () => {
  beforeEach(() => {
    cy.login(); // Step 1: Initialize the user session
    cy.visit('/'); // Step 2: Visit the root / URL
  });

  it('should toggle preview functionality', () => {
    cy.get('header').should('contain.text', 'Preview off'); // Step 3: Check if "Preview off" text is in the header element
    cy.contains('Preview off').click({ force: true }); // Step 4: Click the "Preview off" text
    cy.contains('Preview has been enabled.', { matchCase: false }).should('be.visible'); // Step 5: Verify that "Preview has been enabled." text appeared on the screen
    cy.get('header').should('contain.text', 'Preview on'); // Step 6: Check if "Preview on" text is in the header element
    cy.contains('Preview on').click({ force: true }); // Step 7: Click the "Preview on" text
    cy.contains('Preview has been disabled.', { matchCase: false }).should('be.visible'); // Step 8: Verify that "Preview has been disabled." text appeared on the screen
  });
});
