describe('HelpPanel', () => {
  const disablePreview = () => {
    cy.get("[data-ouia-component-id='PreviewSwitcher']").as('previewSwitch');
    cy.get('@previewSwitch').then(($el) => {
      const elementText = $el.text();
      if (elementText.includes('turn off Preview mode')) {
        cy.wrap($el).click();
      }
    });
  };

  beforeEach(() => {});

  // tests for present functionality, inspired by IQE
  it('allows the user to go directly to the API docs page', () => {
    cy.login();
    cy.visit('/');
    // ensure preview is off before doing element interactions
    disablePreview();
    // open the help menu
    cy.get('#HelpMenu').click();
    cy.get('[data-ouia-component-id="chrome-help"]')
      .should('be.visible')
      .find('[data-ouia-component-id="API documentation"]')
      .should('have.text', 'API documentation')
      .should('be.visible');
    // External links aren't easily verified with Cypress, train stops here
  });

  // panel opens when clicked on and disappears when the 'X' is clicked
  it('opens and closes', () => {});

  // help panel should appear and be reachable from varous Console pages such as
  // Ansible, Inventory, etc.
  it('appears and is accessible from various pages', () => {});

  // The link to the Red Hat Status page is visible and navigates to the correct place when clicked
  it('links to the Red Hat status page', () => {});

  // The search tab is visible and a search for a common topic provides at least one match
  it('provides basic search capability', () => {});

  // Test coverage for the Learn tab, which doesn't appear to work at the moment
  it('provides content under the Learn tab', () => {});

  // Test coverage for the Knowledge base tab, which doesn't work yet
  it('provides content under the Knowledge base tab', () => {});

  // API tab content
  // verify the expected topics are provided
  // verify that pagination works as-expected (once the content is present)
  // verify that a few of the API content links are present and the links go to the expected place
  // verify that the link to the API content catalog works
  it('provides content under the API tab', () => {});

  // When there are support cases open, it should show support case data
  it('shows currently open support cases under the My Support Cases tab', () => {});

  // When there are no support cases open, the tab should so an informative message and provide
  // a link to open a new support case
  it('shows the correct "No support cases" message when no support cases are open', () => {});
});
