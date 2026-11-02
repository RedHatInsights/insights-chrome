import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import LanguageNotifier from './LanguageNotifier';
// The repo-wide manual mock (src/__mocks__/react-intl.js) stubs formatMessage to
// return the raw defaultMessage without value interpolation; these tests
// assert real ICU interpolation, so use the real react-intl.
jest.unmock('react-intl');
// The real provider (src/bootstrap.tsx) feeds the compiled catalog from
// src/locales/data.json; mirror that shape so interpolation behaves as in production.
import enMessages from '../../locales/data.json';

/**
 * The component reads the SSO profile locale from ChromeAuthContext and the
 * browser language from navigator.language. Both are controlled per test.
 */
jest.mock('../../auth/ChromeAuthContext', () => {
  const actualReact = jest.requireActual('react');
  return { __esModule: true, default: actualReact.createContext(undefined) };
});

// The notifier is gated behind the language-detection feature flag.
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

import ChromeAuthContext from '../../auth/ChromeAuthContext';

const mockAuthValue = {
  ssoUrl: 'https://sso.example.com',
  user: { identity: { user: { locale: undefined as string | undefined } } },
};

const setBrowserLanguage = (language: string) => {
  Object.defineProperty(window.navigator, 'language', { value: language, configurable: true });
};

const setProfileLocale = (locale: string | undefined) => {
  mockAuthValue.user.identity.user.locale = locale;
};

const renderNotifier = () =>
  render(
    <IntlProvider locale="en" messages={enMessages.en}>
      {/* The mocked context is typed Context<undefined>; the real value shape is supplied here. */}
      <ChromeAuthContext.Provider value={mockAuthValue as unknown as never}>
        <LanguageNotifier />
      </ChromeAuthContext.Provider>
    </IntlProvider>
  );

describe('LanguageNotifier', () => {
  beforeEach(() => {
    localStorage.clear();
    setBrowserLanguage('en');
    setProfileLocale(undefined);
  });

  it('renders no notification when profile and browser agree', () => {
    setProfileLocale('fr');
    setBrowserLanguage('fr');
    const debugSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { container } = renderNotifier();
    expect(screen.queryByRole('heading', { name: /language not available/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /preferred language available/i })).not.toBeInTheDocument();
    // Nothing renders besides the (empty) portal, and debug logging stays off
    // without the flag.
    expect(container).toBeEmptyDOMElement();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('renders the debug line in the UI behind the chrome:intl:debug flag', () => {
    localStorage.setItem('chrome:intl:debug', 'true');
    setProfileLocale('de');
    setBrowserLanguage('de-DE');
    const debugSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { container } = renderNotifier();

    expect(container.textContent).toContain('[chrome:language] profile: de | browser: de-DE | rendering: en | notification: unsupported (de)');
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('[chrome:language] profile: de | browser: de-DE | rendering: en | notification: unsupported (de)')
    );
    debugSpy.mockRestore();
  });

  it('renders the fallback notification when the profile language is not supported', () => {
    setProfileLocale('de');
    setBrowserLanguage('de-DE');
    renderNotifier();

    expect(screen.getByRole('heading', { name: /language not available/i })).toBeInTheDocument();
    expect(screen.getByText(/we switched it back to English/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Select another language' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://sso.example.com/realms/redhat-external/account/'));
    // "Don't ask again" is discovery-only: the unsupported notice has no
    // permanent opt-out beyond closing it for the current language.
    expect(screen.queryByRole('button', { name: "Don't ask again" })).not.toBeInTheDocument();
  });

  it('renders the discovery notification when the browser language is supported and differs', () => {
    setProfileLocale('en');
    setBrowserLanguage('fr');
    renderNotifier();

    expect(screen.getByRole('heading', { name: /preferred language available/i })).toBeInTheDocument();
    expect(screen.getByText(/Français language is supported by Hybrid Cloud Console now/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Switch language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Don't ask again" })).toBeInTheDocument();
  });

  it('renders the browser language in its own script, sentence-cased', () => {
    setProfileLocale('en');
    setBrowserLanguage('zh-CN');
    renderNotifier();

    // languageDisplayName deliberately uses the tag's own locale, so the
    // language is presented in its own script rather than translated;
    // sentence casing is a no-op for scripts without case.
    const expected = new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of('zh-CN');
    expect(screen.getByText(new RegExp(`${expected} language is supported by Hybrid Cloud Console now`))).toBeInTheDocument();
  });

  it('hides the discovery notification for the session only when closed with X', () => {
    setProfileLocale('en');
    setBrowserLanguage('fr');
    const { unmount } = renderNotifier();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    // The close button never persists: a hurried click cannot permanently
    // hide the feature.
    expect(localStorage.getItem('chrome:language:nudge-seen')).toBeNull();
    expect(screen.queryByRole('heading', { name: /preferred language available/i })).not.toBeInTheDocument();

    // A remount stands in for the next page load: the session state is gone
    // and the notification returns.
    unmount();
    renderNotifier();
    expect(screen.getByRole('heading', { name: /preferred language available/i })).toBeInTheDocument();
  });

  it('permanently hides the discovery notification through the explicit action', () => {
    setProfileLocale('en');
    setBrowserLanguage('fr');
    const { unmount } = renderNotifier();

    fireEvent.click(screen.getByRole('button', { name: "Don't ask again" }));
    expect(localStorage.getItem('chrome:language:nudge-seen')).toBe('true');
    expect(screen.queryByRole('heading', { name: /preferred language available/i })).not.toBeInTheDocument();

    unmount();
    renderNotifier();
    expect(screen.queryByRole('heading', { name: /preferred language available/i })).not.toBeInTheDocument();
  });

  it('dismisses the fallback notification for the dismissed language only', () => {
    setProfileLocale('de');
    setBrowserLanguage('de-DE');
    const first = renderNotifier();

    // Closing the notice is the opt-out: it stores the dismissed language tag.
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(localStorage.getItem('chrome:language:fallback-notice-dismissed')).toBe('de');
    expect(screen.queryByRole('heading', { name: /language not available/i })).not.toBeInTheDocument();

    // Remount (next page load): still quiet for the same language. Toasts portal
    // into document.body, so assert through screen rather than the container.
    first.unmount();
    const second = renderNotifier();
    expect(screen.queryByRole('heading', { name: /language not available/i })).not.toBeInTheDocument();

    // A different unsupported language is new information: the notice returns.
    second.unmount();
    setProfileLocale('it');
    setBrowserLanguage('it-IT');
    renderNotifier();
    expect(screen.getByRole('heading', { name: /language not available/i })).toBeInTheDocument();
  });

  it('navigates to the account console at click time', () => {
    // The toast outlives SPA navigation, so the URL must be built at click
    // time from the live location; buildCurrentReturnTo's unit tests cover
    // the query and hash preservation. jsdom cannot navigate and replacing
    // window.location breaks React's event dispatch, so assert through
    // jsdom's navigation attempt, which proves the handler ran.
    setProfileLocale('en');
    setBrowserLanguage('fr');
    const navError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      renderNotifier();
      fireEvent.click(screen.getByRole('link', { name: 'Switch language' }));
      expect(navError).toHaveBeenCalledTimes(1);
      // jsdom reports the navigation attempt as an Error object.
      expect((navError.mock.calls[0][0] as Error).message).toBe('Not implemented: navigation (except hash changes)');
    } finally {
      navError.mockRestore();
    }
  });

  it('lets modified clicks open the account console in a new tab', () => {
    setProfileLocale('en');
    setBrowserLanguage('fr');
    const navError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      renderNotifier();
      const link = screen.getByRole('link', { name: 'Switch language' });

      // A Ctrl-click must not be hijacked into current-tab navigation: the
      // handler refreshes the href from the live location and lets the
      // browser perform its native (new tab) action.
      // fireEvent.click returns false when the event is canceled, so this
      // also proves the handler did not call preventDefault on the click.
      const notCanceled = fireEvent.click(link, { ctrlKey: true });
      expect(notCanceled).toBe(true);
      // The href is refreshed from the live location...
      expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('fromAccount=1')));
      // ...and no current-tab navigation is attempted: jsdom (correctly) does
      // not follow anchors on modified clicks, so the absence of its
      // navigation report proves the handler did not hijack the click.
      expect(navError).not.toHaveBeenCalled();
    } finally {
      navError.mockRestore();
    }
  });
});
