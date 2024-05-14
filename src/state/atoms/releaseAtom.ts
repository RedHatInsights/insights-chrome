import axios from 'axios';
import { updateVisibilityFunctionsBeta, visibilityFunctionsExist } from '../../utils/VisibilitySingleton';
import { atomWithToggle } from './utils';

export const isPreviewAtom = atomWithToggle(undefined, (isPreview) => {
  // Required to change the `isBeta` function return value in the visibility functions
  if (visibilityFunctionsExist()) {
    updateVisibilityFunctionsBeta(isPreview);
    axios.post('/api/chrome-service/v1/user/update-ui-preview', { uiPreview: isPreview });
  }
});
