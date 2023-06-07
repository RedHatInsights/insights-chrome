const service = "/application-services/api-management"
const dropDownService = "Application services"
// This is the index within the dropdown service name in the services menu.
// For example, API Management is 1st service within Application services, thus index == 0
const serviceIndexInMenu = 0;

describe('Favorite-services', () => {
    it('check and uncheck favorited services', () => {
        cy.visit('/');
        cy.login();
        cy.reload();
        cy.intercept('GET', '/api/chrome-service/v1/user', 
        {
        "data": {
            "id":2435,
            "createdAt":"2023-05-15T18:08:27.38611Z",
            "updatedAt":"2023-06-06T15:04:05.366605Z",
            "deletedAt":null,
            "accountId":"402359432",
            "firstLogin":true,
            "dayOne":true,
            "lastLogin":"2023-05-15T18:08:27.376277Z",
            "lastVisitedPages": [],
            "favoritePages": [],
            "selfReport": {
                "createdAt":"0001-01-01T00:00:00Z",
                "updatedAt":"0001-01-01T00:00:00Z",
                "deletedAt":null,
                "productsOfInterest":null,
                "jobRole":"",
                "userIdentityID":0
            },
            "visitedBundles": {
                "apps":true,
                "ansible":true,
                "landing":true,
                "staging":true,
                "insights":true,
                "internal":true,
                "openshift":true,
                "allservices":true,
                "favoritedservices":true,
                "application-services":true
            }
        }
        }
      );
    // check if a favorites link exists on the page
    cy.get('.pf-c-menu-toggle__text').click();
    cy.contains(dropDownService).click({ force: true });
    cy.get('.pf-c-icon__content').eq(serviceIndexInMenu+3).click({ force: true });
    cy.intercept('POST', 'http://localhost:8080/api/chrome-service/v1/favorite-pages');
    cy.screenshot();
    cy.get('.pf-c-brand').click();
    cy.reload();
    cy.intercept('GET', '/api/chrome-service/v1/user', 
        {
            "data":{
            "id":24353452,
            "createdAt":"2023-05-15T18:08:27.38611Z",
            "updatedAt":"2023-06-06T15:04:05.366605Z",
            "deletedAt":null,
            "accountId":"56118163",
            "firstLogin":true,
            "dayOne":true,
            "lastLogin":"2023-05-15T18:08:27.376277Z",
            "lastVisitedPages": [
                {
                    "id":2345234534,
                    "createdAt":"2023-05-15T18:08:27.506597Z",
                    "updatedAt":"2023-06-07T14:09:36.831334Z",
                    "deletedAt":null,
                    "bundle":"OpenShift",
                    "pathname":"/",
                    "title":"Overview | Red Hat OpenShift Cluster Manager",
                    "userIdentityId":42352345
                },
            ],
            "favoritePages": [
                {
                    "id":1957,
                    "createdAt":"2023-06-05T18:17:26.849084Z",
                    "updatedAt":"2023-06-06T19:23:32.813832Z",
                    "deletedAt":null,
                    "pathname":service,
                    "favorite":true,
                    "userIdentityId":453245
                }
            ],
            "selfReport": {
                "createdAt":"0001-01-01T00:00:00Z",
                "updatedAt":"0001-01-01T00:00:00Z",
                "deletedAt":null,
                "productsOfInterest":null,
                "jobRole":"",
                "userIdentityID":0
            },
            "visitedBundles": {
                "apps":true,
                "ansible":true,
                "landing":true,
                "staging":true,
                "insights":true,
                "internal":true,
                "openshift":true,
                "allservices":true,
                "favoritedservices":true,
                "application-services":true
            }
            }
        }
        );
        cy.wait(2000);
        cy.contains('API Management').should('exist');
        cy.screenshot();
    });
});
  