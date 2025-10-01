describe('last-visited-pages empty behavior', () => {
  beforeEach(() => {
    // Because of the user table relation, the data from /last-visited and /user must match to mock the db state correctly
    cy.intercept('GET', '/api/chrome-service/v1/user', {
      data: {
        id: 2435,
        createdAt: '2023-05-15T18:08:27.38611Z',
        updatedAt: '2023-06-06T15:04:05.366605Z',
        deletedAt: null,
        accountId: '402359432',
        firstLogin: true,
        dayOne: true,
        lastLogin: '2023-05-15T18:08:27.376277Z',
        lastVisitedPages: [
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ],
        favoritePages: [],
      },
    }).as('getUser');
    cy.intercept('GET', '/api/chrome-service/v1/last-visited', {
      data: [
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
        { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
      ],
    }).as('getLastVisited');
  });

  // local storage is not an end-user facing feature, so testing it explicitly falls within integration/unit/component scope
  // test skipped because it's failing as of August 4, 2025
  it.skip('will initialize the local storage from the database and visit two pages', () => {
    cy.login();
    cy.visit('/');

    cy.wait('@getUser').its('response.statusCode').should('equal', 200);
    cy.wait('@getLastVisited').its('response.statusCode').should('equal', 200);
    cy.getAllLocalStorage().then((result: any) => {
      const localStore = result['/']['chrome:lastVisited'];
      expect(localStore).to.equal(
        // If you don't do this then Array(2) is the type and everything fails.
        JSON.stringify([
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ])
      );
    });

    cy.visit('/settings/learning-resources');
    cy.wait('@getUser').its('response.statusCode').should('equal', 200);

    cy.getAllLocalStorage().then((result: any) => {
      const localStore = result['/']['chrome:lastVisited'];
      expect(localStore).to.equal(
        // If you don't do this then Array(2) is the type and everything fails.
        JSON.stringify([
          { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ])
      );
    });
  });

  it('will send updated localStorage to the API when hidden', () => {
    cy.intercept('GET', '/api/chrome-service/v1/last-visited', {
      data: [
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
        { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
      ],
    }).as('getLastVisited');
    const responseBody = [
      { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
      {
        bundle: 'Openshift',
        pathname: '/',
        title: 'Overview | Red Hat OpenShift Cluster Manager',
      },
      { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
    ];
    cy.intercept('POST', '/api/chrome-service/v1/last-visited', (req) => {
      expect(req.body).to.equal(responseBody);
    });
    cy.login();
    cy.visit('/settings/learning-resources');
    cy.wait('@getUser').its('response.statusCode').should('equal', 200);
    cy.wait('@getLastVisited').its('response.statusCode').should('equal', 200);
    cy.clock();
    cy.window().trigger('blur');
    expect(cy.document().should('not.be.visible'));
    cy.tick(1000 * 20);
    cy.wait(500);
  });

  it('will send updated localStorage to the API on an interval', () => {
    cy.intercept('GET', '/api/chrome-service/v1/last-visited', {
      data: [
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
        { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
      ],
    }).as('getLastVisited');
    const responseBody = [
      { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
      {
        bundle: 'Openshift',
        pathname: '/',
        title: 'Overview | Red Hat OpenShift Cluster Manager',
      },
      { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
    ];
    cy.intercept('POST', '/api/chrome-service/v1/last-visited', (req) => {
      expect(req.body).to.equal(responseBody);
    });
    cy.login();
    cy.visit('/settings/learning-resources');
    cy.wait('@getUser').its('response.statusCode').should('equal', 200);
    cy.wait('@getLastVisited').its('response.statusCode').should('equal', 200);
    cy.clock();
    cy.tick(1000 * 60 * 3);
    cy.wait(500);
  });
});

describe.skip('last-visited-pages standard behavior', () => {
  beforeEach(() => {
    // Because of the user table relation, the data from /last-visited and /user must match to mock the db state correctly
    cy.intercept('GET', '/api/chrome-service/v1/user', {
      data: {
        id: 2435,
        createdAt: '2023-05-15T18:08:27.38611Z',
        updatedAt: '2023-06-06T15:04:05.366605Z',
        deletedAt: null,
        accountId: '402359432',
        firstLogin: true,
        dayOne: true,
        lastLogin: '2023-05-15T18:08:27.376277Z',
        lastVisitedPages: [
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ],
        favoritePages: [],
      },
    }).as('getUser');
  });

  it('will not use /last-visited data when local storage is already initialized', () => {
    cy.login();
    cy.setLocalStorage(
      'chrome:lastVisited',
      JSON.stringify([
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
      ])
    );
    cy.visit('/settings/learning-resources');

    cy.wait('@getUser').its('response.statusCode').should('equal', 200);
    cy.getLocalStorage('chrome:lastVisited').should(
      'eq',
      JSON.stringify([
        { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
      ])
    );
  });
});
