import { useContext, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Banner } from '@patternfly/react-core/dist/dynamic/components/Banner';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import GlobeIcon from '@patternfly/react-icons/dist/dynamic/icons/globe-icon';
import TimesIcon from '@patternfly/react-icons/dist/dynamic/icons/times-icon';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { languageAtom } from '../../state/atoms/languageAtom';
import { ACCOUNT_RETURN_PARAM } from '../../hooks/useLanguageResolution';
import { buildAccountConsoleUrl, languageDisplayName } from '../../utils/languageResolution';

/**
 * Discovery-nudge dismissal flag. UX/discovery state, not preference state:
 * per-device and ephemeral by design (same tier as tours and onboarding hints),
 * so localStorage is the correct store. Re-shows on a new browser are acceptable.
 */
const NUDGE_SEEN_KEY = 'chrome:language:nudge-seen';

/**
 * Language notifications for the detection flow (spike branch). Two variants
 * of the same Banner treatment (matching DegradedStateBanner in the shell):
 *
 * - Pinned mismatch notification: the user's SSO language is not supported,
 *   the console falls back to English. State-derived: it stays visible exactly
 *   as long as the mismatch is real and disappears by itself once the profile
 *   changes. No dismissal, no stored state — PatternFly's Banner has none by
 *   design, which is the semantic match for a persistent system state.
 *
 * - Discovery nudge (one-time): the SSO language is English (likely a
 *   registration default) while the browser says otherwise. Same banner with
 *   a close button; dismissal stores the localStorage bit.
 *
 * Both are English-only by construction: their audience is by definition
 * users whose language we do not render. The CTA targets the SSO account
 * console for this spike (the settings page does not exist yet); the referrer
 * mechanism brings the user back with the ACCOUNT_RETURN_PARAM that triggers
 * the token refresh.
 */
export const LanguageBanner = () => {
  const language = useAtomValue(languageAtom);
  const { ssoUrl } = useContext(ChromeAuthContext);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => localStorage.getItem(NUDGE_SEEN_KEY) === 'true');

  if (!language.mismatch && (!language.nudgeCandidate || nudgeDismissed)) {
    return null;
  }

  const returnTo = `${window.location.origin}${window.location.pathname}?${ACCOUNT_RETURN_PARAM}=1`;
  const accountUrl = buildAccountConsoleUrl(ssoUrl, returnTo);

  return (
    <Banner
      status="info"
      screenReaderText={language.mismatch ? 'Language not available, console shown in English' : 'Console available in multiple languages'}
      data-ouia-component-id={language.mismatch ? 'LanguageMismatchBanner' : 'LanguageNudgeBanner'}
    >
      <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
        <div className="pf-v6-u-flex-grow-1 pf-v6-u-text-align-center">
          {language.mismatch ? (
            <>
              <GlobeIcon /> Your language ({languageDisplayName(language.preference)}) isn&apos;t available in the console yet — the console is shown in
              English.{' '}
            </>
          ) : (
            <>
              <GlobeIcon /> The console is available in multiple languages.{' '}
            </>
          )}
          <Button
            variant="link"
            isInline
            component="a"
            href={accountUrl}
            data-ouia-component-id={language.mismatch ? 'LanguageMismatchLink' : 'LanguageNudgeLink'}
          >
            Learn about the supported languages
          </Button>
        </div>
        {!language.mismatch && (
          <Button
            variant="plain"
            aria-label="Dismiss language notification"
            data-ouia-component-id="LanguageNudgeClose"
            onClick={() => {
              localStorage.setItem(NUDGE_SEEN_KEY, 'true');
              setNudgeDismissed(true);
            }}
          >
            <TimesIcon />
          </Button>
        )}
      </div>
    </Banner>
  );
};

export default LanguageBanner;
