import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
