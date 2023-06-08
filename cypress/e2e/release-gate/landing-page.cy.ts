// Declared variables to increase reusability if making breaking change!
const lastVisitedJSON = '{"data":[{"id":210675,"createdAt":"2023-06-08T17:15:46.584521Z","updatedAt":"2023-06-08T17:30:55.424658Z","deletedAt":null,"bundle":"Home","pathname":"/","title":"console.redhat.com","userIdentityId":1},{"id":210678,"createdAt":"2023-06-08T17:16:31.970566Z","updatedAt":"2023-06-08T17:30:09.234024Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/remediations","title":"dashboard | console.redhat.com","userIdentityId":1},{"id":210677,"createdAt":"2023-06-08T17:16:25.350101Z","updatedAt":"2023-06-08T17:30:01.381218Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/dashboard","title":"console.redhat.com","userIdentityId":1},{"id":210696,"createdAt":"2023-06-08T17:26:20.174486Z","updatedAt":"2023-06-08T17:28:21.759746Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/cost-management/ocp","title":"OpenShift - Cost Management | OpenShift","userIdentityId":1},{"id":210695,"createdAt":"2023-06-08T17:25:45.152077Z","updatedAt":"2023-06-08T17:27:47.341141Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/cost-management/ocp/breakdown","title":"OpenShift - Cost Management | OpenShift","userIdentityId":1},{"id":210694,"createdAt":"2023-06-08T17:24:56.40512Z","updatedAt":"2023-06-08T17:24:56.40512Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/patch/templates","title":"Advisories - Patch | Red Hat Insights","userIdentityId":1},{"id":210693,"createdAt":"2023-06-08T17:24:49.401963Z","updatedAt":"2023-06-08T17:24:49.401963Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/patch/advisories","title":"dashboard | console.redhat.com","userIdentityId":1},{"id":210692,"createdAt":"2023-06-08T17:24:15.140323Z","updatedAt":"2023-06-08T17:24:15.140323Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/image-builder/manage-edge-images/9130","title":"console.redhat.com","userIdentityId":1},{"id":210690,"createdAt":"2023-06-08T17:22:45.51411Z","updatedAt":"2023-06-08T17:22:45.51411Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/remediations/6f638c4c-b6b4-48d6-bb30-3024c95b98a2","title":"console.redhat.com","userIdentityId":1},{"id":210689,"createdAt":"2023-06-08T17:20:45.769148Z","updatedAt":"2023-06-08T17:20:45.769148Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/insights/advisor/clusters/1a04eda5-cf73-43e7-88d7-6c7a50e6553f","title":"1a04eda5-cf73-43e7-88d7-6c7a50e6553f - Clusters - OCP Advisor | Red Hat Insights | OpenShift","userIdentityId":1}],"meta":{"count":10,"total":10}}'
const lastVisitedArray = [{"id":210675,"createdAt":"2023-06-08T17:15:46.584521Z","updatedAt":"2023-06-08T17:30:55.424658Z","deletedAt":null,"bundle":"Home","pathname":"/","title":"console.redhat.com","userIdentityId":1},{"id":210678,"createdAt":"2023-06-08T17:16:31.970566Z","updatedAt":"2023-06-08T17:30:09.234024Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/remediations","title":"dashboard | console.redhat.com","userIdentityId":1},{"id":210677,"createdAt":"2023-06-08T17:16:25.350101Z","updatedAt":"2023-06-08T17:30:01.381218Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/dashboard","title":"console.redhat.com","userIdentityId":1},{"id":210696,"createdAt":"2023-06-08T17:26:20.174486Z","updatedAt":"2023-06-08T17:28:21.759746Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/cost-management/ocp","title":"OpenShift - Cost Management | OpenShift","userIdentityId":1},{"id":210695,"createdAt":"2023-06-08T17:25:45.152077Z","updatedAt":"2023-06-08T17:27:47.341141Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/cost-management/ocp/breakdown","title":"OpenShift - Cost Management | OpenShift","userIdentityId":1},{"id":210694,"createdAt":"2023-06-08T17:24:56.40512Z","updatedAt":"2023-06-08T17:24:56.40512Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/patch/templates","title":"Advisories - Patch | Red Hat Insights","userIdentityId":1},{"id":210693,"createdAt":"2023-06-08T17:24:49.401963Z","updatedAt":"2023-06-08T17:24:49.401963Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/patch/advisories","title":"dashboard | console.redhat.com","userIdentityId":1},{"id":210692,"createdAt":"2023-06-08T17:24:15.140323Z","updatedAt":"2023-06-08T17:24:15.140323Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/image-builder/manage-edge-images/9130","title":"console.redhat.com","userIdentityId":1},{"id":210690,"createdAt":"2023-06-08T17:22:45.51411Z","updatedAt":"2023-06-08T17:22:45.51411Z","deletedAt":null,"bundle":"Red Hat Insights","pathname":"/insights/remediations/6f638c4c-b6b4-48d6-bb30-3024c95b98a2","title":"console.redhat.com","userIdentityId":1},{"id":210689,"createdAt":"2023-06-08T17:20:45.769148Z","updatedAt":"2023-06-08T17:20:45.769148Z","deletedAt":null,"bundle":"OpenShift","pathname":"/openshift/insights/advisor/clusters/1a04eda5-cf73-43e7-88d7-6c7a50e6553f","title":"1a04eda5-cf73-43e7-88d7-6c7a50e6553f - Clusters - OCP Advisor | Red Hat Insights | OpenShift","userIdentityId":1}]
const parsedLastVisited = JSON.parse(lastVisitedJSON);
const NUM_SLIDE_ELEMENTS = 4;

// NUM_CHILDREN_ELEMENTS are VISIBLE cards under "Get started with Hybrid Cloud Console capabilities"
const NUM_CHILDREN_ELEMENTS = 8;
const FAVORITED_OVERFILLS = ["Inventory", "Remediations"] 
const FRONT_PAGE_SERVICES = [
  "Red Hat Insights", "Application and Data Services", "Red Hat OpenShift", "Edge Management",
  "Ansible Automation Platform", "Subscription Management", "Red Hat Advanced Cluster Security Cloud Service",
  "Quay.io"
]

describe('Landing page', () => {
  it('visit landing page', () => {
    cy.visit('/');
    cy.login();
    cy.reload();
    cy.intercept('POST', '/api/chrome-service/v1/last-visited', lastVisitedJSON);
    cy.intercept('GET', '/api/chrome-service/v1/user', 
    {
      "data": {
      "id": 24353452,
      "createdAt": "2023-05-15T18:08:27.38611Z",
      "updatedAt": "2023-06-06T15:04:05.366605Z",
      "deletedAt": null,
      "accountId": "56118163",
      "firstLogin": true,
      "dayOne": true,
      "lastLogin": "2023-05-15T18:08:27.376277Z",
      "lastVisitedPages": lastVisitedArray,
      "favoritePages": [
          {
              "id": 1957,
              "createdAt": "2023-06-05T18:17:26.849084Z",
              "updatedAt": "2023-06-06T19:23:32.813832Z",
              "deletedAt": null,
              "pathname": '/application-services/api-management',
              "favorite": true,
              "userIdentityId": 453245
          },
          {
            "id": 1960,
            "createdAt": "2023-06-05T18:17:26.849084Z",
            "updatedAt": "2023-06-06T19:23:32.813832Z",
            "deletedAt": null,
            "pathname": '/application-services/service-accounts',
            "favorite": true,
            "userIdentityId": 453245
          },
          {
            "id": 1961,
            "createdAt": "2023-06-05T18:17:26.849084Z",
            "updatedAt": "2023-06-06T19:23:32.813832Z",
            "deletedAt": null,
            "pathname": '/application-services/trusted-content',
            "favorite": true,
            "userIdentityId": 453245
          },
          {
            "id": 1958,
            "createdAt": "2023-06-05T18:17:26.849084Z",
            "updatedAt": "2023-06-06T19:23:32.813832Z",
            "deletedAt": null,
            "pathname": '/ansible/automation-hub',
            "favorite": true,
            "userIdentityId": 453245
        },
        {
          "id": 1959,
          "createdAt": "2023-06-05T18:17:26.849084Z",
          "updatedAt": "2023-06-06T19:23:32.813832Z",
          "deletedAt": null,
          "pathname": '/ansible/inventory',
          "favorite": true,
          "userIdentityId": 453245
        },
        {
          "id": 1979,
          "createdAt": "2023-06-05T18:17:26.849084Z",
          "updatedAt": "2023-06-06T19:23:32.813832Z",
          "deletedAt": null,
          "pathname": '/ansible/remediations',
          "favorite": true,
          "userIdentityId": 453245
        }
      ],
      "selfReport": {
          "createdAt": "0001-01-01T00:00:00Z",
          "updatedAt": "0001-01-01T00:00:00Z",
          "deletedAt": null,
          "productsOfInterest": null,
          "jobRole": "",
          "userIdentityID": 0
      },
      "visitedBundles": {
          "apps": true,
          "ansible": true,
          "landing": true,
          "staging": true,
          "insights": true,
          "internal": true,
          "openshift": true,
          "allservices": true,
          "favoritedservices": true,
          "application-services": true
      }
      }
    });
    cy.wait(3000);
    cy.contains('API Management').should('exist');
    cy.get('.pf-c-button.pf-m-plain').eq(1).click();
    for (let i = 0; i < FAVORITED_OVERFILLS.length; i++) {
      cy.get('.chr-c-favorite-service__tile').eq(i).find('.pf-u-mb-sm').should('contain', FAVORITED_OVERFILLS[i]);
    }
    cy.contains('View my favorite services').should('exist');
    cy.contains('Recently visited').should('exist');
    for (let i = 0; i < lastVisitedArray.length; i++) {
      cy.get('small[data-ouia-component-type="PF4/Text"]').eq(i).should('contain', parsedLastVisited.data[i].bundle);
    }
    // Verify that the photo slides exist
    for (let i = 0; i < NUM_SLIDE_ELEMENTS; i++) {
      cy.get('.slick-track').find(`[data-index="${i}"].slick-slide`).should('exist');
    }
    for (let i = 0; i < NUM_SLIDE_ELEMENTS - 1; i++) {
      cy.get('.slick-arrow.slick-next').should('exist');
      cy.wait(1000);
      cy.get('.slick-arrow.slick-next').click();
    }
    cy.get('.slick-arrow.slick-next.slick-disabled').should('exist');
    for (let i = 0; i < FRONT_PAGE_SERVICES.length; i++) {
      cy.get('.pf-l-gallery.pf-m-gutter').eq(1).find(`article[data-ouia-component-id="OUIA-Generated-Card-${i+1}"]`).find('.pf-u-font-size-lg.pf-u-mt-md').should('contain', FRONT_PAGE_SERVICES[i]);
    }
    cy.get('.pf-l-gallery.pf-m-gutter').eq(1).children().should('have.length', NUM_CHILDREN_ELEMENTS);
    cy.screenshot();
  });
});
