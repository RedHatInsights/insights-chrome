import axios from 'axios';
import { updateVisibilityFunctionsBeta, visibilityFunctionsExist } from '../../utils/VisibilitySingleton';
import { atomWithToggle } from './utils';
import { unleashClient } from '../../components/FeatureFlags/FeatureFlagsProvider';

export const isPreviewAtom = atomWithToggle(undefined, (isPreview) => {
  // Required to change the `isBeta` function return value in the visibility functions
  if (visibilityFunctionsExist()) {
    updateVisibilityFunctionsBeta(isPreview);
    axios.post('/api/chrome-service/v1/user/update-ui-preview', { uiPreview: isPreview });
  }
  // Required to change the `platform.chrome.ui.preview` context in the feature flags, TS is bugged
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  unleashClient?.updateContext({ 'platform.chrome.ui.preview': isPreview });
});
