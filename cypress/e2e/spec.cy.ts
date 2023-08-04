describe('Test environment init', () => {
  it(
    'initializes user session',
    {
      retries: 3,
    },
    () => {
      // authenticate the session
      cy.login();
    }
  );
});
