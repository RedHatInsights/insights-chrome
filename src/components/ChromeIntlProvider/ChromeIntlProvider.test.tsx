import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Provider, useSetAtom } from 'jotai';
import { createStore } from 'jotai';
import ChromeIntlProvider from './ChromeIntlProvider';
import { languageAtom } from '../../state/atoms/languageAtom';

// The repo-wide manual mock stubs useIntl without a locale; this test
// asserts the real provider wiring.
jest.unmock('react-intl');

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
});
