import { useContext, useState } from 'react';
import { AlertActionLink } from '@patternfly/react-core/dist/dynamic/components/Alert';
import Portal, { PortalNotificationConfig } from '@redhat-cloud-services/frontend-components-notifications/Portal';
import { useIntl } from 'react-intl';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import messages from '../../locales/Messages';
import {
  ACCOUNT_RETURN_PARAM,
  INTL_DEBUG_KEY,
  buildAccountConsoleUrl,
  buildCurrentReturnTo,
  getNotificationCase,
  resolveLocale,
  sentenceCaseDisplayName,
} from '../../utils/languageResolution';

/**
 * Discovery-nudge permanent opt-out ("Don't ask again"). Per-device and
 * ephemeral by design, so localStorage is the correct store.
 */
const NUDGE_SEEN_KEY = 'chrome:language:nudge-seen';

/**
 * Unsupported-language notice dismissal. Stores the dismissed profile
 * language tag rather than a boolean: the notice stays silent while the
 * profile keeps the same unsupported language and returns only when a
 * different unsupported language is selected.
 */
const FALLBACK_NOTICE_DISMISSED_KEY = 'chrome:language:fallback-notice-dismissed';

const UNSUPPORTED_NOTIFICATION_ID = 'language-unsupported';
const DISCOVERY_NOTIFICATION_ID = 'language-discovery';

/**
 * Language notifications. Reads the SSO profile locale and navigator.language
 * directly (per the ADR: the notification's logic is internal to this
 * component). Does not go through the languageAtom.
 *
 * Rendered as toast notifications (not banners) per the UX mocks:
 *
 * - Unsupported language: the profile language has no catalog, so the console
 *   renders English. "Language not available / we switched it back to
 *   English." Shows once per unsupported language: closing it dismisses it
 *   for that language, and it returns only when a different unsupported
 *   language is selected. No "Don't ask again" — closing is the opt-out.
 * - Discovery nudge: the browser language differs from the profile language
 *   and is supported. "{language} is supported by Hybrid Cloud Console now.
 *   Would you like to switch to it?" Disappears on its own once the user
 *   switches to that language; the close button hides it for the session
 *   only, so a hurried click cannot permanently hide the feature, and
 *   "Don't ask again" is the explicit permanent opt-out.
 * - No notification: browser agrees with profile, or neither case applies.
 *
 * Keycloak defaults the profile locale to "en_US" when no choice is made,
 * so a user with a non-English browser and a default profile gets the
 * discovery nudge.
 *
 * Resolution details render in a debug line below the notifications when
 * the "chrome:intl:debug" localStorage flag is set.
 */
export const LanguageNotifier = () => {
  const { ssoUrl, user } = useContext(ChromeAuthContext);
  const intl = useIntl();

  const [sessionDismissed, setSessionDismissed] = useState<Record<string, boolean>>({});
  const [nudgePermanentlyDismissed, setNudgePermanentlyDismissed] = useState(() => localStorage.getItem(NUDGE_SEEN_KEY) === 'true');
  const [fallbackDismissedFor, setFallbackDismissedFor] = useState(() => localStorage.getItem(FALLBACK_NOTICE_DISMISSED_KEY));

  const profileLocale = user?.identity?.user?.locale as string | undefined;
  const notification = getNotificationCase(profileLocale, navigator.language);
  const renderingLocale = resolveLocale(profileLocale);
  const debugEnabled = localStorage.getItem(INTL_DEBUG_KEY) === 'true';

  const returnTo = `${window.location.origin}${window.location.pathname}?${ACCOUNT_RETURN_PARAM}=1`;
  const accountUrl = buildAccountConsoleUrl(ssoUrl, returnTo);

  /**
   * The toast persists across SPA navigation, so the boot-time accountUrl can
   * be stale by the time the user clicks. Navigate from the live location so
   * the user returns to the page they are actually on, query string and hash
   * included. The href stays as a fallback for open-in-new-tab.
   */
  const goToAccountConsole = (event: React.MouseEvent) => {
    event.preventDefault();
    window.location.assign(buildAccountConsoleUrl(ssoUrl, buildCurrentReturnTo()));
  };

  /**
   * Close-button handler (Portal's removeNotification).
   * - Discovery nudge: session-only; in-memory state dies with the page, so
   *   the notification returns on the next load.
   * - Unsupported-language notice: permanent for the current profile
   *   language; it returns only when a different unsupported language is
   *   selected.
   */
  const dismissNotification = (id: string) => {
    if (id === DISCOVERY_NOTIFICATION_ID) {
      setSessionDismissed((prev) => ({ ...prev, [id]: true }));
    }
    if (id === UNSUPPORTED_NOTIFICATION_ID && notification.type === 'unsupported') {
      localStorage.setItem(FALLBACK_NOTICE_DISMISSED_KEY, notification.profileLanguage);
      setFallbackDismissedFor(notification.profileLanguage);
    }
  };

  /** "Don't ask again" handler for the discovery nudge: the only persistent opt-out. */
  const dismissNudgePermanently = () => {
    localStorage.setItem(NUDGE_SEEN_KEY, 'true');
    setNudgePermanentlyDismissed(true);
  };

  const notifications: PortalNotificationConfig[] = [];

  if (notification.type === 'unsupported' && fallbackDismissedFor !== notification.profileLanguage) {
    notifications.push({
      id: UNSUPPORTED_NOTIFICATION_ID,
      variant: 'info',
      dismissable: true,
      autoDismiss: false,
      title: intl.formatMessage(messages.languageNotAvailableTitle),
      description: intl.formatMessage(messages.languageNotAvailableBody),
      actionLinks: (
        <AlertActionLink component="a" href={accountUrl} onClick={goToAccountConsole} data-ouia-component-id="LanguageNotificationSelectAnotherLanguage">
          {intl.formatMessage(messages.languageSelectAnother)}
        </AlertActionLink>
      ),
    });
  }

  if (notification.type === 'discovery' && !nudgePermanentlyDismissed && !sessionDismissed[DISCOVERY_NOTIFICATION_ID]) {
    notifications.push({
      id: DISCOVERY_NOTIFICATION_ID,
      variant: 'info',
      dismissable: true,
      autoDismiss: false,
      title: intl.formatMessage(messages.languagePreferredAvailableTitle),
      description: intl.formatMessage(messages.languagePreferredAvailableBody, {
        language: sentenceCaseDisplayName(notification.browserLanguage),
      }),
      actionLinks: (
        <>
          <AlertActionLink component="a" href={accountUrl} onClick={goToAccountConsole} data-ouia-component-id="LanguageNotificationSwitchLanguage">
            {intl.formatMessage(messages.languageSwitch)}
          </AlertActionLink>
          <AlertActionLink onClick={dismissNudgePermanently} data-ouia-component-id="LanguageNotificationDontAskAgainDiscovery">
            {intl.formatMessage(messages.languageDontAskAgain)}
          </AlertActionLink>
        </>
      ),
    });
  }

  if (debugEnabled) {
    const detail = notification.type === 'discovery' ? ` (${notification.browserLanguage})` : '';
    const profileDetail = notification.type === 'unsupported' ? ` (${notification.profileLanguage})` : '';
    console.log(
      `[chrome:language] profile: ${profileLocale ?? 'undefined'} | browser: ${navigator.language} | rendering: ${renderingLocale} | notification: ${notification.type}${detail}${profileDetail}`
    );
  }

  return (
    <>
      <Portal removeNotification={dismissNotification} notifications={notifications} />
      {debugEnabled && (
        <div
          style={{
            textAlign: 'center',
            padding: '4px 0',
            fontSize: '11px',
            color: 'var(--pf-v6-c-text-color--m-subtle, #6a6e73)',
            fontFamily: 'monospace',
          }}
        >
          [chrome:language] profile: {profileLocale ?? 'undefined'} | browser: {navigator.language} | rendering: {renderingLocale} | notification:{' '}
          {notification.type}
          {notification.type === 'discovery' ? ` (${notification.browserLanguage})` : ''}
          {notification.type === 'unsupported' ? ` (${notification.profileLanguage})` : ''}
        </div>
      )}
    </>
  );
};

export default LanguageNotifier;
