# Test recently visited feature.

Write a e2e cypress test that verifies the recently visited feature.


Configure the test defaultCommandTimeout option to be one minute.

Steps:

1. use the cy.login command to initialize the user session
2. Visit the root / URL
3. Store the current document title
4. Click the link element with "RHEL" text
5. Wait for 5 seconds
6. Store the current document title
7. Expand the navigation panel by clicking ona butting with "nav-toggle" id
8. Expand the navigation by clicking on the "Inventory" text in the navigation
9. Click the navigation item with text "Systems"
10. Wait for 5 seconds
11. Store the current document title
12. Click the link in the first row of the table
13. Wait for 5 seconds
14. Store the current document title
15. Click the image in the header with the "Red Hat Logo" alt attribute
16. Verify that all stored document titles are visible on current page 

When searching for links, make sure the elements have the "a" tag.

When clicking items use the "force" option to get around overlapping items.

Store all the document titles to a array of string. Do not nest promises.

To verify the titles, iterate over each array item individually.
