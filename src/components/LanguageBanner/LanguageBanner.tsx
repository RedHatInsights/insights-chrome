import { useContext, useState } from 'react';
import { Banner } from '@patternfly/react-core/dist/dynamic/components/Banner';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import GlobeIcon from '@patternfly/react-icons/dist/dynamic/icons/globe-icon';
import TimesIcon from '@patternfly/react-icons/dist/dynamic/icons/times-icon';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { ACCOUNT_RETURN_PARAM } from '../../hooks/useLanguageResolution';
import { buildAccountConsoleUrl, getNotificationCase, languageDisplayName, resolveLocale } from '../../utils/languageResolution';

/**
 * Discovery-nudge dismissal flag. Per-device and ephemeral by design,
 * so localStorage is the correct store.
 */
const NUDGE_SEEN_KEY = 'chrome:language:nudge-seen';

/**
 * Language notification component. Reads the SSO profile locale and
 * navigator.language directly (per the ADR: the notification's logic is
 * internal to this component). Does not go through the languageAtom.
 *
 * Two notification states:
 *
 * - Discovery nudge (one-time): the SSO locale differs from the browser
 *   language and the browser language is supported. "The console is
 *   available in [browser language]."
 * - No notification: browser agrees with profile, or browser language is
 *   not supported.
 *
 * Keycloak defaults the profile locale to "en_US" when no choice is made,
 * so a user with a non-English browser and a default profile gets the
 * discovery nudge — the multilingual invitation scenario (no profile
 * locale at all) does not occur in practice.
 *
 * Below the notification, a debug line shows the resolved rendering locale
 * (spike only, not part of the ADR).
 */
export const LanguageBanner = () => {
  const { ssoUrl, user } = useContext(ChromeAuthContext);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => localStorage.getItem(NUDGE_SEEN_KEY) === 'true');

  const profileLocale = user?.identity?.user?.locale as string | undefined;
  const notification = getNotificationCase(profileLocale, navigator.language);
  const renderingLocale = resolveLocale(profileLocale);

  const showNotification = notification.type === 'discovery' && !nudgeDismissed;

  const returnTo = `${window.location.origin}${window.location.pathname}?${ACCOUNT_RETURN_PARAM}=1`;
  const accountUrl = buildAccountConsoleUrl(ssoUrl, returnTo);

  const dismissNudge = () => {
    localStorage.setItem(NUDGE_SEEN_KEY, 'true');
    setNudgeDismissed(true);
  };

  return (
    <>
      {showNotification && (
        <Banner status="info" screenReaderText="Console available in multiple languages" data-ouia-component-id="LanguageNotificationBanner">
          <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
            <div className="pf-v6-u-flex-grow-1 pf-v6-u-text-align-center">
              <GlobeIcon /> The console is available in {languageDisplayName(notification.browserLanguage)}.{' '}
              <Button variant="link" isInline component="a" href={accountUrl} data-ouia-component-id="LanguageNotificationLink">
                Choose your language
              </Button>
            </div>
            <Button
              variant="plain"
              icon={<TimesIcon />}
              onClick={dismissNudge}
              aria-label="Dismiss"
              data-ouia-component-id="LanguageNotificationDismiss"
            />
          </div>
        </Banner>
      )}
      <div
        style={{
          textAlign: 'center',
          padding: '4px 0',
          fontSize: '11px',
          color: 'var(--pf-v6-c-text-color--m-subtle, #6a6e73)',
          fontFamily: 'monospace',
        }}
      >
        [spike] profile: {profileLocale ?? 'undefined'} | browser: {navigator.language} | rendering: {renderingLocale} | notification: {notification.type}
        {notification.type === 'discovery' ? ` (${notification.browserLanguage})` : ''}
      </div>
    </>
  );
};

export default LanguageBanner;
