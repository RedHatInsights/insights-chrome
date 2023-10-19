import { useFlag } from '@unleash/proxy-client-react';
import { isBeta, isProd } from './common';

export const usePreviewFlag = (flag: string) => {
  const notificationsOverhaul = useFlag(flag);

  if (isProd() && !isBeta()) {
    return false;
  }

  return notificationsOverhaul;
};
