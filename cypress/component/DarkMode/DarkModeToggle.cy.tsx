import React from 'react';
import DarkModeToggle from '../../../src/components/Header/DarkModeToggle';
import { Card, CardBody, CardFooter, CardTitle } from '@patternfly/react-core';

function DarkMode() {
  return (
    <>
      <DarkModeToggle />
      <Card>
        <CardTitle component="h4">Title within an {'<h4>'} element</CardTitle>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
      <Card>
        <CardTitle component="h4">Title within an {'<h4>'} element</CardTitle>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    </>
  );
}

describe('ThemeToggle Component', () => {
  beforeEach(() => {});

  describe('Initial State', () => {
    it('uses localStorage dark preference', () => {
      localStorage.setItem('chrome:theme', 'dark');
      const elem = cy.mount(<DarkMode />).get('html');
      elem.matchImageSnapshot();
    });
    it('uses localStorage light preference', () => {
      localStorage.setItem('chrome:theme', 'light');
      const elem = cy.mount(<DarkMode />).get('html');
      elem.matchImageSnapshot();
    });
    it('falls back to system dark preference', () => {
      cy.window().then((win) => {
        cy.stub(win, 'matchMedia').returns({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
        });
      });
      cy.mount(<DarkMode />).get('html');
      cy.getLocalStorage('chrome:theme').should('equal', 'dark');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
    it('falls back to system light preference', () => {
      cy.window().then((win) => {
        cy.stub(win, 'matchMedia').returns({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
        });
      });
      cy.mount(<DarkMode />).get('html');
      cy.getLocalStorage('chrome:theme').should('equal', 'light');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
    });
  });

  describe('User Interactions', () => {
    it('toggles from light to dark', () => {
      localStorage.setItem('chrome:theme', 'light');
      cy.mount(<DarkMode />).get('html');
      cy.get('.pf-v6-c-switch__toggle').click();
      cy.get('#no-label-switch-on').should('be.checked');
      cy.getLocalStorage('chrome:theme').should('equal', 'dark');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
    it('toggles from dark to light', () => {
      localStorage.setItem('chrome:theme', 'dark');
      cy.mount(<DarkMode />).get('html');
      cy.get('.pf-v6-c-switch__toggle').click();
      cy.get('#no-label-switch-on').should('not.be.checked');
      cy.getLocalStorage('chrome:theme').should('equal', 'light');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
    });
  });

  describe('Persistence', () => {
    it('prioritizes localStorage over system preference', () => {
      localStorage.setItem('chrome:theme', 'dark');
      cy.window().then((win) => {
        cy.stub(win, 'matchMedia').returns({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
        });
      });
      cy.mount(<DarkMode />).get('html');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
  });
});
