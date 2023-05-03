import { useFlag } from '@unleash/proxy-client-react';
import { isBeta } from '../utils/common';

const useEnableSummitFeature = () => {
  const flagEnabled = useFlag('platform.chrome.navigation-dropdown');
  return flagEnabled || isBeta();
};

export default useEnableSummitFeature;
