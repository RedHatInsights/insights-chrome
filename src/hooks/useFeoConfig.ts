import { useFlag } from '@unleash/proxy-client-react';

const useFeoConfig = () => {
  const useFeoConfig = useFlag('platform.chrome.consume-feo');

  return useFeoConfig;
};

export default useFeoConfig;
