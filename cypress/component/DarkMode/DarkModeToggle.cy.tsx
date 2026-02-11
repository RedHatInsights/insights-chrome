import React from 'react';
import { Button, Card, CardBody, CardFooter, CardTitle } from '@patternfly/react-core';
import { useTheme } from '../../../src/hooks/useTheme';

function DarkMode() {
  const { setLightMode, setDarkMode, setSystemMode } = useTheme();

  return (
    <>
      <Button variant="primary" size="lg" id="system-button" onClick={setSystemMode}>
        System
      </Button>
      <Button variant="primary" size="lg" id="light-button" onClick={setLightMode}>
        Light
      </Button>
      <Button variant="primary" size="lg" id="dark-button" onClick={setDarkMode}>
        Dark
      </Button>
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

describe('ThemeMenu Component', () => {
  beforeEach(() => {});

  describe('Initial State', () => {
    it('uses localStorage dark preference', () => {
      cy.setLocalStorage('chrome:theme', 'dark');
      cy.mount(<DarkMode />).get('html');
      cy.getLocalStorage('chrome:theme').should('equal', 'dark');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
    it('uses localStorage light preference', () => {
      cy.setLocalStorage('chrome:theme', 'light');
      cy.mount(<DarkMode />).get('html');
      cy.getLocalStorage('chrome:theme').should('equal', 'light');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
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
      cy.getLocalStorage('chrome:theme').should('equal', 'system');
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
      cy.getLocalStorage('chrome:theme').should('equal', 'system');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
    });
  });

  describe('User Interactions', () => {
    it('toggles from light to dark', () => {
      localStorage.setItem('chrome:theme', 'light');
      cy.mount(<DarkMode />).get('html');
      cy.get('#dark-button').click();
      cy.getLocalStorage('chrome:theme').should('equal', 'dark');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
    it('toggles from dark to light', () => {
      localStorage.setItem('chrome:theme', 'dark');
      cy.mount(<DarkMode />).get('html');
      cy.get('#light-button').click();
      cy.getLocalStorage('chrome:theme').should('equal', 'light');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
    });
    it('toggles from dark to system light', () => {
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
      cy.get('#system-button').click();
      cy.getLocalStorage('chrome:theme').should('equal', 'system');
      cy.get('html').should('not.have.class', 'pf-v6-theme-dark');
    });
    it('toggles from system light to dark', () => {
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
      cy.get('#dark-button').click();
      cy.getLocalStorage('chrome:theme').should('equal', 'dark');
      cy.get('html').should('have.class', 'pf-v6-theme-dark');
    });
  });
});
