import axios from 'axios';
import { updateVisibilityFunctionsBeta, visibilityFunctionsExist } from '../../utils/VisibilitySingleton';
import { atomWithToggle } from './utils';
import { getUnleashClient, unleashClientExists } from '../../components/FeatureFlags/unleashClient';

export const isPreviewAtom = atomWithToggle(undefined, async (isPreview) => {
  try {
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
});
