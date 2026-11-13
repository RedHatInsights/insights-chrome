import React from 'react';
import { Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent } from '@patternfly/react-core';

import '../../src/layouts/DefaultLayout.scss';

const THEME_CLASSES = ['pf-v6-theme-dark', 'pf-v6-theme-glass'];

/**
 * Mirrors the markup PF `Page` produces for notification drawer / help panel content:
 * a `.pf-v6-c-page__drawer` wrapper around a `Drawer`. `DefaultLayout.scss` scoped its
 * drawer rules to that wrapper, so the class is required to exercise them.
 */
const DrawerHarness = () => (
  <div className="pf-v6-c-page__drawer">
    <Drawer isExpanded>
      <DrawerContent panelContent={<DrawerPanelContent>Help panel</DrawerPanelContent>}>
        <DrawerContentBody>Page content</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  </div>
);

const setTheme = (classes: string[]) => cy.get('html').then(($html) => $html.removeClass(THEME_CLASSES.join(' ')).addClass(classes.join(' ')));

/** Parses the alpha channel out of a computed `rgb()` / `rgba()` colour. */
const alphaOf = (color: string) => {
  const channels = color.replace(/^rgba?\(|\)$/g, '').split(',');
  return channels.length < 4 ? 1 : parseFloat(channels[3]);
};

/**
 * Resolves a CSS custom property to its computed colour by applying it to a probe element
 * mounted as a sibling, so the token resolves in the same cascade context as the panel.
 */
const resolveTokenColor = (sibling: Element, token: string) => {
  const probe = sibling.ownerDocument.createElement('div');
  probe.style.backgroundColor = `var(${token})`;
  sibling.parentElement!.appendChild(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
};

// RHCLOUD-52189: chrome used to override the drawer panel background onto the
// `primary--default` token, which glass mode defines as semi-transparent
// (rgb(255,255,255,0.6) light / rgb(41,41,41,0.5) dark), and then layered a second
// glass-only override on top to compensate. PF's own default for the panel is the always
// solid `floating--default`, so chrome must add no override at all: the panel has to stay
// fully opaque AND match the PF token in every theme.
describe('Help panel drawer opacity', () => {
  afterEach(() => {
    cy.get('html').then(($html) => $html.removeClass(THEME_CLASSES.join(' ')));
  });

  [
    { name: 'default theme', classes: [] },
    { name: 'dark theme', classes: ['pf-v6-theme-dark'] },
    { name: 'glass theme', classes: ['pf-v6-theme-glass'] },
    { name: 'dark + glass theme', classes: ['pf-v6-theme-dark', 'pf-v6-theme-glass'] },
  ].forEach(({ name, classes }) => {
    it(`renders the drawer panel opaque, straight from the PF floating token, in ${name}`, () => {
      cy.mount(<DrawerHarness />);
      setTheme(classes);

      cy.get('.pf-v6-c-drawer__panel')
        .should('be.visible')
        .then(($panel) => {
          const panel = $panel[0];
          const background = getComputedStyle(panel).backgroundColor;
          const floating = resolveTokenColor(panel, '--pf-t--global--background--color--floating--default');

          expect(floating, 'floating token resolves to a colour').to.match(/^rgba?\(/);
          expect(alphaOf(background), 'drawer panel background alpha').to.equal(1);
          expect(background, 'panel uses the PF default rather than a chrome override').to.equal(floating);
        });
    });
  });
});
