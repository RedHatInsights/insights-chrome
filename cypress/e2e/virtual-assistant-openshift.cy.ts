describe('Virtual Assistant on OpenShift Pages', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should not display virtual assistant on OpenShift overview page', () => {
    cy.visit('/openshift/overview');
    
    cy.get('.virtualAssistant.astro__virtual-assistant').should('not.exist');
  });

  it('should not display virtual assistant on OpenShift cost management page', () => {
    cy.visit('/openshift/cost-management');
    
    cy.get('.virtualAssistant.astro__virtual-assistant').should('not.exist');
  });

  it('should not display virtual assistant on OpenShift subscriptions page', () => {
    cy.visit('/openshift/subscriptions');
    
    cy.get('.virtualAssistant.astro__virtual-assistant').should('not.exist');
  });

  it('should not display virtual assistant on general OpenShift pages', () => {
    cy.visit('/openshift');
    
    cy.get('.virtualAssistant.astro__virtual-assistant').should('not.exist');
  });
});