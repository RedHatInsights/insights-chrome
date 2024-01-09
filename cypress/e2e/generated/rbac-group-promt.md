# Test creation and deletion of rbac group

Write an e2e cypress test that verifies the creation and removal of rbac group.

Configure the test defaultCommandTimeout option to be one minute.

Steps:

1. use the cy.login command to initialize the user session
2. Visit the /iam/user-access/groups URL
3. Click button with "Create group" text 
4. Type "platex-services" to the group name input with "Group name" aria-label
5. Wait for 5 seconds
6. Click the "Next" button
7. Wait for 5 seconds
8. Click the "Next" button
9. Click the "Next" button
10. Click the "Submit" button
11. Click the "Exit" button
12. Type "platex-services" into the input with "filter-by-string" id
13. Wait for 5 seconds
14. Expand the dropdown by clicking on a button with "Kebab toggle" aria-label attribute
15. Click on the "Delete" button
16. Click on a label with text "I understand that this action cannot be undone."
17. Click on the "Delete group" button
19. Wait for 5 seconds
12. Type "platex-services" into the input with "filter-by-string" id
13. Wait for 5 seconds
20. Check that the "platex-services" link is not present on the page.


When checking text on the screen, ignore the character case. When clicking elements use the force option

Call the login in the beforeEach segment.
