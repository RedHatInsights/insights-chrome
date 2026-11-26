import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider, createStore } from 'jotai';
import { FlagProvider, InMemoryStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { ScalprumProvider } from '@scalprum/react-core';
import { ChromeUser } from '@redhat-cloud-services/types';
import Navigation from '../../src/components/Navigation';
import AllServicesSection from '../../src/components/AllServices/AllServicesSection';
import ServiceTile from '../../src/components/FavoriteServices/ServiceTile';
import { isAllServicesGroup } from '../../src/components/AllServices/allServicesLinks';
import { Menu, MenuList } from '@patternfly/react-core';
import SearchInput from '../../src/components/Search/SearchInput';
import useNavigation from '../../src/utils/useNavigation';
import useTabName from '../../src/hooks/useTabName';
import { useInitVisibleBundles, useVisibleServiceTiles } from '../../src/state/atoms/visibleBundlesAtom';
import { languageAtom } from '../../src/state/atoms/languageAtom';
import { initializeVisibilityFunctions } from '../../src/utils/VisibilitySingleton';
import { setUnleashClient } from '../../src/components/FeatureFlags/unleashClient';
import bundles from '../../testdata/feo-localization/bundles.json';
import locales from '../../testdata/feo-localization/locales.json';
import french from '../../testdata/feo-localization/messages.fr.json';
import userFixture from '../fixtures/testUser.json';

const USERS_PATH = '/iam/user-access/users';
const CATALOG_DELAY_MS = 800;
// The shared Japanese fixture is empty; distinct text makes stale-response
// assertions distinguish the selected locale from both English and French.
const japanese = {
  'nav.rbac.iam.user-access.users.title': 'ユーザー',
  'serviceCategory.security.title': 'セキュリティ',
};
const tiles = [
  {
    id: 'security',
    title: 'Security',
    links: [
      {
        id: 'access',
        title: 'Access',
        isGroup: true,
        links: [
          {
            id: 'user-access',
            frontendRef: 'rbac',
            section: 'security',
            group: 'access',
            title: 'User Access',
            description: 'Manage access',
            href: USERS_PATH,
          },
        ],
      },
    ],
  },
];

const LocalizedShell = () => {
  useInitVisibleBundles();
  useTabName();
  const { schema, loaded } = useNavigation();
  const { tiles } = useVisibleServiceTiles();
  return (
    <div data-testid="locale-root">
      <div data-testid="navigation">{schema && <Navigation loaded={loaded} schema={schema} />}</div>
      <div data-testid="tiles">
        {tiles.map((section) => (
          <AllServicesSection key={section.id} {...section} />
        ))}
        <Menu>
          <MenuList>
            {tiles
              .flatMap((section) => section.links.flatMap((link) => (isAllServicesGroup(link) ? link.links : [link])))
              .map((tile) => (
                <ServiceTile key={tile.href} name={tile.title} pathname={tile.href} description={tile.description} />
              ))}
          </MenuList>
        </Menu>
      </div>
      <Suspense fallback={<div>Loading search</div>}>
        <SearchInput onStateChange={() => {}} />
      </Suspense>
    </div>
  );
};

describe('FEO localization in the browser', () => {
  let store: ReturnType<typeof createStore>;
  let client: UnleashClient;
  let browserErrors: unknown[];

  beforeEach(() => {
    store = createStore();
    browserErrors = [];
    cy.on('uncaught:exception', (error) => {
      browserErrors.push(error);
      return false;
    });
    cy.window().then((win) => {
      win.history.replaceState({}, '', USERS_PATH);
      win.addEventListener('unhandledrejection', (event) => browserErrors.push(event.reason));
    });
    initializeVisibilityFunctions({
      getUser: () => Promise.resolve(userFixture as ChromeUser),
      getToken: () => Promise.resolve('test-token'),
      getUserPermissions: () => Promise.resolve([]),
      isPreview: false,
    });
    cy.intercept('GET', '**/api/chrome-service/v1/user*', { favoritePages: [] });
    cy.intercept('GET', '**/bundles-generated.json', { body: bundles });
    cy.intercept('GET', '**/service-tiles-generated.json', { body: tiles });
    cy.intercept('GET', '**/search-index.json', { body: [] });
    cy.intercept('GET', '**/search-index-generated.json', {
      body: [{ id: 'rbac-stage-users', href: USERS_PATH, title: 'Users', description: 'Manage users in your account', alt_title: ['People', 'Accounts'] }],
    });
    cy.intercept('GET', '**/locales.json', { body: locales });
    cy.intercept('GET', '**/messages.fr.json', { body: french }).as('french');
    cy.intercept('GET', '**/messages.ja.json', { body: japanese }).as('japanese');
    cy.then(() => {
      client = new UnleashClient({
        url: `${window.location.origin}/test-flags`,
        clientKey: 'test',
        appName: 'locale-test',
        disableMetrics: true,
        storageProvider: new InMemoryStorageProvider(),
        bootstrap: [{ name: 'platform.chrome.consume-feo', enabled: true }],
      });
      setUnleashClient(client);
      return new Promise<void>((resolve) => {
        if (client.isReady()) resolve();
        else client.once('ready', resolve);
      });
    });
    cy.then(() =>
      cy.mount(
        <ScalprumProvider config={{}} api={{ chrome: { auth: { getUser: () => Promise.resolve(userFixture) } } }}>
          <Provider store={store}>
            <FlagProvider unleashClient={client} startClient={false}>
              <IntlProvider locale="en">
                <MemoryRouter initialEntries={[USERS_PATH]}>
                  <LocalizedShell />
                </MemoryRouter>
              </IntlProvider>
            </FlagProvider>
          </Provider>
        </ScalprumProvider>
      )
    );
    cy.get('[data-testid="navigation"]').contains('a', 'Users').should('have.attr', 'href', USERS_PATH);
  });

  afterEach(() => {
    client?.stop();
    cy.then(() => expect(browserErrors).to.deep.equal([]));
  });

  it('switches real shell surfaces and bilingual search in place, including existing query results', () => {
    let originalRoot: HTMLElement;
    cy.get('[data-testid="locale-root"]').then(($root) => {
      originalRoot = $root[0];
    });
    cy.get('button[aria-label="Expandable search input toggle"]').click();
    cy.get('input[placeholder="Search for services"]').click().type('People');
    cy.get('[role="menu"]').contains('Users').should('be.visible');
    cy.then(() => store.set(languageAtom, 'fr'));
    cy.wait('@french');
    cy.get('[data-testid="navigation"]').contains('a', 'Utilisateurs').should('have.attr', 'href', USERS_PATH);
    cy.get('[data-testid="tiles"]')
      .should('contain.text', 'Sécurité')
      .and('contain.text', 'Accès utilisateur')
      .and('contain.text', 'Gérer qui peut faire quoi');
    cy.get('[role="menu"]').should('contain.text', 'Utilisateurs').and('contain.text', 'Gérer les utilisateurs de votre compte');
    cy.window().its('document.title').should('contain', 'Utilisateurs').and('contain', 'Gestion des identités et des accès');
    cy.get('input[placeholder="Search for services"]').clear().type('Personnes');
    cy.get('[role="menu"]').contains('Utilisateurs').should('be.visible');
    cy.get('input[placeholder="Search for services"]').clear().type('Users');
    cy.get('[role="menu"]').contains('Utilisateurs').should('be.visible');
    cy.then(() => store.set(languageAtom, 'en'));
    cy.get('[data-testid="navigation"]').contains('a', 'Users').should('have.attr', 'href', USERS_PATH);
    cy.get('[role="menu"]').contains('Users').should('be.visible');
    for (const alias of ['People', 'Accounts']) {
      cy.get('input[placeholder="Search for services"]').clear().type(alias);
      cy.get('[role="menu"]').contains('Users').should('be.visible');
    }
    cy.get('input[placeholder="Search for services"]').clear().type('Personnes');
    cy.get('[role="menu"]').should('not.contain.text', 'Users').and('not.contain.text', 'Utilisateurs');
    cy.get('[data-testid="tiles"]').should('contain.text', 'Security').and('contain.text', 'Manage access');
    cy.get('[data-testid="locale-root"]').should(($root) => expect($root[0]).to.equal(originalRoot));
    cy.window().its('location.pathname').should('equal', USERS_PATH);
  });

  it('keeps the distinct current Japanese catalog when a previous French response arrives late', () => {
    let frenchRequested = false;
    cy.intercept('GET', '**/messages.fr.json', (request) => {
      frenchRequested = true;
      request.reply({ body: french, delay: CATALOG_DELAY_MS });
    }).as('delayedFrench');
    cy.then(() => store.set(languageAtom, 'fr'));
    cy.wrap(null).should(() => expect(frenchRequested).to.equal(true));
    cy.then(() => store.set(languageAtom, 'ja'));
    cy.wait('@japanese');
    cy.get('[data-testid="navigation"]').should('contain.text', japanese['nav.rbac.iam.user-access.users.title']);
    cy.wait('@delayedFrench');
    cy.get('[data-testid="navigation"]').should('contain.text', japanese['nav.rbac.iam.user-access.users.title']).and('not.contain.text', 'Utilisateurs');
    cy.get('[data-testid="tiles"]').should('contain.text', japanese['serviceCategory.security.title']);
  });
});
