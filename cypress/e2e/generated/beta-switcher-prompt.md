# Test beta switcher toggle functionality

Write an e2e cypress test that verifies the toggle preview functionality.

Steps:

1. use the cy.login command to initialize the user session
2. Visit the root / URL
3. Check if a a text "Preview off" text is in the header element
4. Click the "Preview off" text
5. Verify that "Preview has been enabled." text appeared on the screen
6. Check if a a text "Preview on" text is in the header element
7. Click the "Preview on" text
8. Verify that "Preview has been disabled." text appeared on the screen

When checking text on the screen, ignore the character case. When clicking elements use the force option
