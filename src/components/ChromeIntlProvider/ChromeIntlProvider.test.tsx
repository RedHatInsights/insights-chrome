import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Provider, useSetAtom } from 'jotai';
import { createStore } from 'jotai';
import ChromeIntlProvider from './ChromeIntlProvider';
import { languageAtom } from '../../state/atoms/languageAtom';

// The repo-wide manual mock stubs useIntl without a locale; this test
// asserts the real provider wiring.
jest.unmock('react-intl');

// Control the catalog loaders per test.
jest.mock('../../locales/messageCatalogs', () => ({ messageCatalogs: {} as Record<string, () => Promise<{ default: Record<string, string> }>> }));
import { messageCatalogs } from '../../locales/messageCatalogs';

const SetLocale = ({ locale }: { locale: string }) => {
  const setLanguage = useSetAtom(languageAtom);
  React.useEffect(() => {
    setLanguage(locale as never);
  }, [locale, setLanguage]);
  return null;
};

const LocaleProbe = () => {
  const intl = useIntl();
  return <span data-testid="resolved-locale">{intl.locale}</span>;
};

const renderWith = (locale: string) =>
  render(
    <Provider store={createStore()}>
      <SetLocale locale={locale} />
      <ChromeIntlProvider>
        <FormattedMessage id="test-message" defaultMessage="English fallback text" />
        <LocaleProbe />
      </ChromeIntlProvider>
    </Provider>
  );

describe('ChromeIntlProvider', () => {
  let originalLang: string;
  let originalConsoleLanguage: string | null;
  beforeEach(() => {
    originalLang = document.documentElement.lang;
    originalConsoleLanguage = document.documentElement.getAttribute('data-console-language');
  });
  afterEach(() => {
    document.documentElement.lang = originalLang;
    if (originalConsoleLanguage === null) document.documentElement.removeAttribute('data-console-language');
    else document.documentElement.setAttribute('data-console-language', originalConsoleLanguage);
  });

  it('separates the requested language from the rendered catalog language', async () => {
    const store = createStore();
    let resolveFrench!: (catalog: { default: Record<string, string> }) => void;
    let rejectJapanese!: (error: Error) => void;
    messageCatalogs.fr = () =>
      new Promise((resolve) => {
        resolveFrench = resolve;
      });
    messageCatalogs.ja = () =>
      new Promise((_resolve, reject) => {
        rejectJapanese = reject;
      });
    try {
      render(
        <Provider store={store}>
          <ChromeIntlProvider>
            <FormattedMessage id="test-message" defaultMessage="English fallback text" />
            <LocaleProbe />
          </ChromeIntlProvider>
        </Provider>
      );
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dataset.consoleLanguage).toBe('en');
      act(() => store.set(languageAtom, 'fr'));
      expect(document.documentElement.dataset.consoleLanguage).toBe('fr');
      expect(document.documentElement.lang).toBe('en');
      expect(screen.getByText('English fallback text')).toBeInTheDocument();
      await act(async () => resolveFrench({ default: { 'test-message': 'Texte français' } }));
      expect(screen.getByText('Texte français')).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
      act(() => store.set(languageAtom, 'ja'));
      expect(document.documentElement.dataset.consoleLanguage).toBe('ja');
      expect(document.documentElement.lang).toBe('fr');
      expect(screen.getByText('Texte français')).toBeInTheDocument();
      await act(async () => rejectJapanese(new Error('chunk load failed')));
      expect(screen.getByText('English fallback text')).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dataset.consoleLanguage).toBe('ja');
      act(() => store.set(languageAtom, 'en'));
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dataset.consoleLanguage).toBe('en');
    } finally {
      delete messageCatalogs.fr;
      delete messageCatalogs.ja;
    }
  });

  it.each(['fr', 'ko', 'ja', 'zh-CN'])('keeps English document language when %s has no catalog', (locale) => {
    renderWith(locale);
    expect(screen.getByText('English fallback text')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.consoleLanguage).toBe(locale);
  });

  it('reads English messages from the flat compiled catalog', () => {
    render(
      <Provider store={createStore()}>
        <ChromeIntlProvider>
          <FormattedMessage id="login" defaultMessage="Unused fallback" />
        </ChromeIntlProvider>
      </Provider>
    );
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders with the English catalog for the default locale', () => {
    renderWith('en');
    expect(screen.getByText('English fallback text')).toBeInTheDocument();
  });

  it('falls back to defaultMessages for locales whose catalog has not shipped yet', () => {
    renderWith('fr');
    // The locale drives the provider; without a French catalog the English
    // defaultMessage renders (with a suppressed MISSING_TRANSLATION error).
    expect(screen.getByText('English fallback text')).toBeInTheDocument();
    expect(screen.getByTestId('resolved-locale')).toHaveTextContent('fr');
  });

  it('loads a delivered catalog on demand', async () => {
    (messageCatalogs as Record<string, () => Promise<{ default: Record<string, string> }>>).fr = () =>
      Promise.resolve({ default: { 'test-message': 'Texte de repli anglais' } });
    try {
      renderWith('fr');
      // The delivered catalog replaces the English fallback once loaded.
      expect(await screen.findByText('Texte de repli anglais')).toBeInTheDocument();
      expect(screen.getByTestId('resolved-locale')).toHaveTextContent('fr');
    } finally {
      delete (messageCatalogs as Record<string, () => Promise<{ default: Record<string, string> }>>).fr;
    }
  });

  it('falls back to defaultMessages when a catalog load fails', async () => {
    (messageCatalogs as Record<string, () => Promise<{ default: Record<string, string> }>>).fr = () => Promise.reject(new Error('chunk load failed'));
    try {
      renderWith('fr');
      // The rejection resolves to the English fallback under the resolved
      // locale, not a crash. Wait for the locale flip first: the fallback
      // text is already present from the English first paint.
      await waitFor(() => expect(screen.getByTestId('resolved-locale')).toHaveTextContent('fr'));
      expect(screen.getByText('English fallback text')).toBeInTheDocument();
    } finally {
      delete (messageCatalogs as Record<string, () => Promise<{ default: Record<string, string> }>>).fr;
    }
  });
});
