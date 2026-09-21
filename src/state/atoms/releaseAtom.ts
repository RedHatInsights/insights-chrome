import axios from 'axios';
import { updateVisibilityFunctionsBeta, visibilityFunctionsExist } from '../../utils/VisibilitySingleton';
import { atomWithToggle } from './utils';
import { getUnleashClient, unleashClientExists } from '../../components/FeatureFlags/unleashClient';
import { SearchPermissionsCache } from './localSearchAtom';
import { WritableAtom, atom } from 'jotai';
import { userConfigAtom } from './userConfigAtom';
import { ChromeUserConfig } from '../../utils/initUserConfig';
import { LIGHTWELL_PATH } from '../../utils/common';

const isLightwellPath = window.location.pathname.startsWith(LIGHTWELL_PATH);

export const previewModalOpenAtom = atomWithToggle(false);

const HIDE_PREVIEW_BANNER_KEY = 'chrome:preview:banner:hide';

// Private primitive holding the current preview value. Written only through `isPreviewAtom`
// (user toggle, persists) or `hydratePreviewAtom` (trusted source, does not persist).
const previewValueAtom = atom<boolean>(false);

// Shared side effects for a preview change. `persist` controls the ONLY difference between a user
// toggle and a hydrate: whether the value is written back to the personalization API. Everything
// else (search cache, visibility functions, feature-flag context, banner) runs in both cases.
async function applyPreviewSideEffects(isPreview: boolean, persist: boolean) {
  try {
    SearchPermissionsCache.clear();
    // Required to change the `isBeta` function return value in the visibility functions
    if (visibilityFunctionsExist()) {
      updateVisibilityFunctionsBeta(isPreview);
      if (persist) {
        await axios.post('/api/chrome-service/v1/user/update-ui-preview', { uiPreview: isPreview });
      }
    }
    if (unleashClientExists()) {
      // Required to change the `platform.chrome.ui.preview` context in the feature flags, TS is bugged
      getUnleashClient().updateContext({
        // make sure to re-use the prev context
        ...getUnleashClient().getContext(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'platform.chrome.ui.preview': isPreview,
      });
    }
  } catch (error) {
    console.error('Failed to update the visibility functions or feature flags context', error);
  }

  // make sure the banner shows after preview is toggled
  if (isPreview) {
    localStorage.removeItem(HIDE_PREVIEW_BANNER_KEY);
  }
}

/**
 * User-facing preview toggle. On write it persists the value to the personalization API
 * (update-ui-preview POST) alongside the visibility/feature-flag side effects. Keeps the historical
 * `atomWithToggle` contract: read `boolean`, write `boolean | undefined` (undefined flips the
 * current value); the POST stays fire-and-forget so the toggle is non-blocking.
 */
export const isPreviewAtom = atom(
  (get) => get(previewValueAtom),
  (get, set, nextValue?: boolean) => {
    const update = nextValue ?? !get(previewValueAtom);
    set(previewValueAtom, update);
    void applyPreviewSideEffects(update, true);
  }
) as WritableAtom<boolean, [boolean?], void>;

/**
 * Hydrate preview from a trusted source (server config on load, or the degraded fallback) WITHOUT
 * persisting it back. Runs the same visibility/feature-flag side effects as a user toggle but never
 * POSTs update-ui-preview, so a transient config-fetch failure can never clobber the user's saved
 * preference (see `useSessionConfig`).
 */
export const hydratePreviewAtom = atom(null, (get, set, isPreview: boolean) => {
  set(previewValueAtom, isPreview);
  void applyPreviewSideEffects(isPreview, false);
});

export const togglePreviewWithCheckAtom = atom(null, (get, set, update?: boolean) => {
  const isPreview = get(isPreviewAtom);
  const userConfig = get(userConfigAtom);
  if (!isPreview && !userConfig.data?.uiPreviewSeen) {
    set(previewModalOpenAtom, true);
  } else {
    set(isPreviewAtom, update);
  }
});

const initialHidePreviewBanner = localStorage.getItem(HIDE_PREVIEW_BANNER_KEY) === 'true';
export const hidePreviewBannerAtom = atomWithToggle(initialHidePreviewBanner, async (hidePreviewBanner) => {
  // hide the banner for session until preview is turned off
  if (hidePreviewBanner) {
    localStorage.setItem(HIDE_PREVIEW_BANNER_KEY, 'true');
  }
});

/**
 * Atom for layouts to signal that the preview banner should be hidden.
 * Initialized from the current pathname so the banner never renders on Lightwell routes,
 * even before any component mounts.
 */
export const layoutBannerHiddenAtom = atom(isLightwellPath);

/**
 * Atom for layouts to signal that the glass theme should be force-enabled.
 * Initialized from the current pathname so the glass theme is already active
 * before Header/Tools first renders on Lightwell routes.
 */
export const layoutForceGlassThemeAtom = atom(isLightwellPath);

/**
 * Atom for layouts to signal that the felt theme should be force-enabled.
 * Initialized from the current pathname so the felt theme is already active
 * before Header/Tools first renders on Lightwell routes.
 */
export const layoutForceFeltThemeAtom = atom(isLightwellPath);

/**
 * Atom for layouts to signal a simplified header for Lightwell.
 * When true, the AllServicesDropdown is replaced with a static "Lightwell"
 * header and the Search input is hidden.
 */
export const layoutLightwellHeaderAtom = atom(isLightwellPath);

export const setPreviewSeenAtom = atom(null, async (get, set) => {
  try {
    const userConfig = await axios.post<ChromeUserConfig>('/api/chrome-service/v1/user/mark-preview-seen');
    set(userConfigAtom, userConfig.data);
  } catch (error) {
    console.error('Failed to update the preview seen flag', error);
  }
});
