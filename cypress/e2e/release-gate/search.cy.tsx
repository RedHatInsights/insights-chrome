const searchResponse = {
  response: {
    numFound: 2,
    start: 0,
    maxScore: 10.0,
    docs: [
      {
        id: 'hcc-module-/openshift/create-OPENSHIFT.cluster.create.azure',
        view_uri: 'https://console.redhat.com/openshift/create',
        documentKind: 'ModuleDefinition',
        allTitle: 'Azure Red Hat OpenShift',
        bundle: ['openshift'],
        bundle_title: ['OpenShift'],
        relative_uri: '/openshift/create',
        alt_titles: ['ARO', 'Azure', 'OpenShift on Azure'],
        abstract: 'https://console.redhat.com/openshift/create',
        timestamp: '2023-08-22T17:01:31.717Z',
        _version_: 1774949404248113152,
      },
      {
        id: 'hcc-module-/openshift/releases-openshift.releases',
        view_uri: 'https://console.redhat.com/openshift/releases',
        documentKind: 'ModuleDefinition',
        allTitle: 'Releases',
        bundle: ['openshift'],
        bundle_title: ['OpenShift'],
        relative_uri: '/openshift/releases',
        icons: 'InfrastructureIcon',
        abstract: 'View general information on the most recent OpenShift Container Platform release versions that you can install.',
        timestamp: '2023-08-15T10:55:46.769Z',
        _version_: 1774949404248113152,
      },
    ],
  },
  highlighting: {
    'hcc-module-/openshift/create-OPENSHIFT.cluster.create.azure': {
      abstract: ['https://console.redhat.com/<mark>openshift</mark>/create'],
      allTitle: ['Azure Red Hat <mark>OpenShift</mark>'],
      bundle: ['<mark>openshift</mark>'],
    },
    'hcc-module-/openshift/releases-openshift.releases': {
      abstract: ['View general information on the most recent <mark>OpenShift</mark> Container Platform release versions that you can install.'],
      allTitle: ['Releases'],
      bundle: ['<mark>openshift</mark>'],
    },
  },
};

describe('Search', () => {
  it('search for openshift services', () => {
    cy.login();
    cy.visit('/');
    cy.intercept(
      {
        method: 'GET',
        url: '**/hydra/rest/search/**',
      },
      searchResponse
    ).as('search');
    cy.get('.chr-c-search__input').click().type('openshift');
    cy.wait('@search').its('response.statusCode').should('equal', 200);
    cy.get('@search.all').should('have.length', 1);
    cy.screenshot();
    cy.get('.chr-c-search__input').should('contain', 'Top 2 results');
    cy.get('.chr-c-search__input li').first().should('contain', 'Azure');
    cy.get('.chr-c-search__input li').last().should('contain', 'Releases').click();
    cy.url().should('contain', '/openshift/releases');
  });
});
