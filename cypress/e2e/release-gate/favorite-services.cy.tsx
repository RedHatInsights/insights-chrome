const service = '/application-services/api-management';
let interceptionCounter = false;
const serviceName = 'Red Hat Insights';

describe.skip('Favorite-services', () => {
  it('check and uncheck favorited services', () => {
    cy.visit('/');
    cy.login();
    cy.visit('/');
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
        lastVisitedPages: [],
        favoritePages: [],
        selfReport: {
          createdAt: '0001-01-01T00:00:00Z',
          updatedAt: '0001-01-01T00:00:00Z',
          deletedAt: null,
          productsOfInterest: null,
          jobRole: '',
          userIdentityID: 0,
        },
        visitedBundles: {
          apps: true,
          ansible: true,
          landing: true,
          staging: true,
          insights: true,
          internal: true,
          openshift: true,
          allservices: true,
          favoritedservices: true,
          'application-services': true,
        },
      },
    });
    cy.intercept({
      method: 'GET',
      url: '**/services/services.json',
    }).as('services');

    cy.wait('@services').its('response.statusCode').should('equal', 200);
    // check if a favorites link exists on the page
    cy.get('button').contains('Services').click();
    cy.contains('View all services').click({ force: true });
    cy.contains(serviceName).parent('.chr-c-favorite-trigger').find('.pf-v6-c-icon').click({ force: true });
    cy.intercept('POST', '/api/chrome-service/v1/favorite-pages', {
      data: [
        {
          id: 4,
          createdAt: '2023-01-13T12:50:22.095031Z',
          updatedAt: '2023-01-13T12:56:05.377946Z',
          deletedAt: null,
          pathname: service,
          favorite: true,
          userIdentityId: 1,
        },
      ],
      meta: {
        count: 1,
        total: 1,
      },
    }).then(() => {
      interceptionCounter = true;
    });
    cy.contains(serviceName).parent('.chr-c-favorite-trigger.chr-c-icon-favorited').should('exist');
    cy.get('.pf-v6-c-brand').click();
    cy.intercept('GET', '/api/chrome-service/v1/user', {
      data: {
        id: 24353452,
        createdAt: '2023-05-15T18:08:27.38611Z',
        updatedAt: '2023-06-06T15:04:05.366605Z',
        deletedAt: null,
        accountId: '56118163',
        firstLogin: true,
        dayOne: true,
        lastLogin: '2023-05-15T18:08:27.376277Z',
        lastVisitedPages: [
          {
            id: 2345234534,
            createdAt: '2023-05-15T18:08:27.506597Z',
            updatedAt: '2023-06-07T14:09:36.831334Z',
            deletedAt: null,
            bundle: 'OpenShift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
            userIdentityId: 42352345,
          },
        ],
        favoritePages: [
          {
            id: 1957,
            createdAt: '2023-06-05T18:17:26.849084Z',
            updatedAt: '2023-06-06T19:23:32.813832Z',
            deletedAt: null,
            pathname: service,
            favorite: true,
            userIdentityId: 453245,
          },
        ],
        selfReport: {
          createdAt: '0001-01-01T00:00:00Z',
          updatedAt: '0001-01-01T00:00:00Z',
          deletedAt: null,
          productsOfInterest: null,
          jobRole: '',
          userIdentityID: 0,
        },
        visitedBundles: {
          apps: true,
          ansible: true,
          landing: true,
          staging: true,
          insights: true,
          internal: true,
          openshift: true,
          allservices: true,
          favoritedservices: true,
          'application-services': true,
        },
      },
    }).then(() => {
      if (interceptionCounter == false) {
        throw new Error('The request was not intercepted.');
      }
    });
    cy.wait(2000);
    cy.get('.chr-c-favorite-service__tile').find('.pf-v6-u-pb-0').should('contain', serviceName);
  });
});
