import axios from 'axios';
import { captureException } from '@sentry/react';
jest.mock('@sentry/react', () => ({ captureException: jest.fn() }));
import { createStore } from 'jotai';
import { act, waitFor } from '@testing-library/react';
import { advertisedFeoLocalesAtom, feoLocalizationEnabledAtom, feoMessagesAtom } from './feoLocaleAtom';
import { languageAtom } from './languageAtom';
import { localizedNavigationAtom, navigationAtom } from './navigationAtom';
import locales from '../../../testdata/feo-localization/locales.json';
import messages from '../../../testdata/feo-localization/messages.fr.json';

const STATIC = '/api/chrome-service/v1/static';

beforeEach(() => {
  jest.clearAllMocks();
  return jest.spyOn(axios, 'get').mockImplementation(async (url) => {
    if (url === `${STATIC}/locales.json`) return { data: locales };
    if (url === `${STATIC}/messages.fr.json`) return { data: messages };
    throw new Error('missing file');
  });
});
afterEach(() => jest.restoreAllMocks());

function initStore() {
  const store = createStore();
  store.set(feoLocalizationEnabledAtom, true);
  store.sub(feoMessagesAtom, () => {});
  return store;
}

describe('FEO locale loading', () => {
  it('exposes advertised locales and switches overlays without replacing English source', async () => {
    const store = initStore();
    const english = {
      iam: { id: 'iam', title: 'IAM', sortedLinks: [], navItems: [{ title: 'Users', href: '/iam/users', i18nKey: 'nav.rbac.iam.user-access.users' }] },
    };
    store.set(navigationAtom, english);
    expect(await store.get(advertisedFeoLocalesAtom)).toEqual(locales);
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(localizedNavigationAtom).iam.navItems[0].title).toBe('Utilisateurs'));
    expect(store.get(navigationAtom)).toBe(english);
    store.set(languageAtom, 'en');
    await waitFor(() => expect(store.get(localizedNavigationAtom)).toEqual(english));
  });

  it.each(['ko', 'ja'] as const)('falls back for unadvertised or missing %s assets', async (locale) => {
    const store = initStore();
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual(messages));
    store.set(languageAtom, locale);
    if (locale === 'ja') {
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith(`${STATIC}/messages.ja.json`));
    }
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual({}));
    if (locale === 'ko') {
      expect(axios.get).not.toHaveBeenCalledWith(`${STATIC}/messages.ko.json`);
      expect(captureException).not.toHaveBeenCalled();
    } else {
      expect(captureException).toHaveBeenCalledWith(expect.any(Error), { level: 'warning', tags: { area: 'feo-localization', asset: 'messages.ja.json' } });
    }
  });

  it('does not request catalogs when FEO consumption is disabled', async () => {
    const store = createStore();
    store.set(languageAtom, 'fr');
    store.sub(feoMessagesAtom, () => {});
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual({}));
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('rejects malformed manifests and unsafe file paths', async () => {
    jest.mocked(axios.get).mockResolvedValue({
      data: [{ id: 'fr', name: 'French', file: 'https://evil.test/messages.fr.json' }, null, { id: '../fr', name: 'French', file: 'messages.../fr.json' }],
    });
    const store = initStore();
    store.set(languageAtom, 'fr');
    expect(await store.get(advertisedFeoLocalesAtom)).toEqual([]);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), { level: 'warning', tags: { area: 'feo-localization', asset: 'locales.json' } });
  });

  it.each([null, [], 'not a catalog', { 'bundle.iam.title': 123 }])('reports malformed advertised catalogs: %p', async (catalog) => {
    jest.mocked(axios.get).mockImplementation(async (url) => ({ data: String(url).endsWith('locales.json') ? locales : catalog }));
    const store = initStore();
    store.set(languageAtom, 'fr');
    await waitFor(() =>
      expect(captureException).toHaveBeenCalledWith(expect.any(Error), { level: 'warning', tags: { area: 'feo-localization', asset: 'messages.fr.json' } })
    );
    expect(store.get(feoMessagesAtom)).toEqual({});
  });

  it('retains valid translations and reports malformed values in a partial catalog', async () => {
    jest.mocked(axios.get).mockImplementation(async (url) => ({ data: String(url).endsWith('locales.json') ? locales : { ...messages, malformed: 123 } }));
    const store = initStore();
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual(messages));
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), { level: 'warning', tags: { area: 'feo-localization', asset: 'messages.fr.json' } });
  });

  it('reports a manifest load failure while keeping English usable', async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error('network failure'));
    const store = initStore();
    store.set(languageAtom, 'fr');
    expect(await store.get(advertisedFeoLocalesAtom)).toEqual([]);
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), { level: 'warning', tags: { area: 'feo-localization', asset: 'locales.json' } });
  });

  it('ignores a late previous-locale response and returns to English without reload', async () => {
    let resolveFrench!: (response: { data: typeof messages }) => void;
    const frenchRequest = new Promise<{ data: typeof messages }>((resolve) => {
      resolveFrench = resolve;
    });
    jest.mocked(axios.get).mockImplementation(async (url) => {
      if (url === `${STATIC}/locales.json`) return { data: locales };
      if (url === `${STATIC}/messages.fr.json`) return frenchRequest;
      return { data: { 'bundle.iam.title': '日本語' } };
    });
    const store = initStore();
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(`${STATIC}/messages.fr.json`));
    store.set(languageAtom, 'ja');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual({ 'bundle.iam.title': '日本語' }));
    // act drains the response's downstream promise notifications before the
    // assertion; Japanese must remain selected throughout obsolete processing.
    await act(async () => {
      resolveFrench({ data: messages });
      await frenchRequest;
    });
    expect(store.get(feoMessagesAtom)).toEqual({ 'bundle.iam.title': '日本語' });
    store.set(languageAtom, 'en');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual({}));
  });
});
