import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import useTabName from './useTabName';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../state/atoms/chromeModuleAtom';
import { feoLocalizationEnabledAtom } from '../state/atoms/feoLocaleAtom';
import { languageAtom } from '../state/atoms/languageAtom';
import messages from '../../testdata/feo-localization/messages.fr.json';
import locales from '../../testdata/feo-localization/locales.json';

import useBreadcrumbsLinks from './useBreadcrumbsLinks';
jest.mock('./useBreadcrumbsLinks', () => ({ __esModule: true, default: jest.fn() }));

afterEach(() => {
  jest.restoreAllMocks();
  jsdomReset();
});

it.each([
  { hasBreadcrumbs: true, translatedTitle: 'Accès utilisateur' },
  { hasBreadcrumbs: true, translatedTitle: '鍵' },
  { hasBreadcrumbs: false, translatedTitle: 'Accès utilisateur' },
])(
  'updates existing module title ($translatedTitle, breadcrumbs: $hasBreadcrumbs), preserving English behavior',
  async ({ hasBreadcrumbs, translatedTitle }) => {
    document.title = 'Existing title';
    jest.mocked(useBreadcrumbsLinks).mockReturnValue(hasBreadcrumbs ? [{ title: 'Console' }, { title: 'IAM' }, { title: 'User Access' }] : []);
    const catalog = { ...messages, 'module.rbac.defaultDocumentTitle': translatedTitle };
    jest.spyOn(axios, 'get').mockImplementation(async (url) => ({ data: String(url).endsWith('locales.json') ? locales : catalog }));
    jsdomReconfigure({ url: 'https://localhost/iam/user-access' });
    const store = createStore();
    store.set(activeModuleAtom, 'rbac');
    store.set(chromeModulesAtom, { rbac: { manifestLocation: '/rbac.json', defaultDocumentTitle: 'User Access' } });
    store.set(feoLocalizationEnabledAtom, true);
    renderHook(useTabName, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <MemoryRouter>{children}</MemoryRouter>
        </Provider>
      ),
    });
    await waitFor(() => expect(document.title).toBe(hasBreadcrumbs ? 'User Access | Identity & Access Management' : 'Existing title'));
    act(() => store.set(languageAtom, 'fr'));
    await waitFor(() => expect(document.title).toBe(hasBreadcrumbs ? `${translatedTitle} | Gestion des identités et des accès` : 'Existing title'));
    expect(window.location.pathname).toBe('/iam/user-access');
    expect(store.get(chromeModulesAtom).rbac.defaultDocumentTitle).toBe('User Access');
    act(() => store.set(languageAtom, 'en'));
    await waitFor(() => expect(document.title).toBe(hasBreadcrumbs ? 'User Access | Identity & Access Management' : 'Existing title'));
  }
);
