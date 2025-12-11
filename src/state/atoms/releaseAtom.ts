import axios from 'axios';
import { updateVisibilityFunctionsBeta, visibilityFunctionsExist } from '../../utils/VisibilitySingleton';
import { atomWithToggle } from './utils';
import { getUnleashClient, unleashClientExists } from '../../components/FeatureFlags/unleashClient';
import { SearchPermissionsCache } from './localSearchAtom';
import { atom } from 'jotai';
import { userConfigAtom } from './userConfigAtom';
import { ChromeUserConfig } from '../../utils/initUserConfig';

export const previewModalOpenAtom = atomWithToggle(false);

const HIDE_PREVIEW_BANNER_KEY = 'chrome:preview:banner:hide';
export const isPreviewAtom = atomWithToggle(undefined, async (isPreview) => {
  try {
    SearchPermissionsCache.clear();
    // Required to change the `isBeta` function return value in the visibility functions
    if (visibilityFunctionsExist()) {
      updateVisibilityFunctionsBeta(isPreview);
      await axios.post('/api/chrome-service/v1/user/update-ui-preview', { uiPreview: isPreview });
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

export const setPreviewSeenAtom = atom(null, async (get, set) => {
  try {
    const userConfig = await axios.post<ChromeUserConfig>('/api/chrome-service/v1/user/mark-preview-seen');
    set(userConfigAtom, userConfig.data);
  } catch (error) {
    console.error('Failed to update the preview seen flag', error);
  }
});
