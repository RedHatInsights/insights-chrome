import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { matchPath } from 'react-router-dom';

import { ChromeModule, ReduxState } from '../redux/store';
import { isFedRamp } from './common';
const isFedrampEnv = isFedRamp();

export const computeFedrampResult = (
  isFedrampEnv: boolean | string,
  linkHref = '',
  { modules, isFedramp }: Omit<ChromeModule, 'manifestLocation'> = { modules: [] }
) => {
  /**
   * Render everything on non-fedramp env
   */
  if (!isFedrampEnv) {
    return undefined;
  }

  /**
   * Look for module routes with fedramp flag that match the link
   */
  const configs =
    modules
      ?.map(({ routes }) => routes)
      .flat()
      .filter((route) => {
        if (typeof route !== 'object') {
          return false;
        }

        const match = matchPath(linkHref, route.pathname);

        return match !== null;
      })
      .filter((moduleRoute) => typeof moduleRoute !== 'string' && typeof moduleRoute.isFedramp === 'boolean') || [];
  const result = configs.length > 0 ? configs.some((moduleRoute) => typeof moduleRoute !== 'string' && moduleRoute.isFedramp === true) : undefined;

  if (typeof result === 'boolean') {
    return result;
  }
  /**
   * Global module setting has the lowest priority
   */
  return isFedramp;
};

const useRenderFedramp = (appId: string, linkHref: string) => {
  const module = useSelector(({ chrome: { modules } }: ReduxState) => modules && modules[appId]);
  const [shouldRender, setShouldRender] = useState(() => computeFedrampResult(isFedrampEnv, linkHref, module));

  useEffect(() => {
    setShouldRender(computeFedrampResult(isFedrampEnv, linkHref, module));
  }, [appId, linkHref]);

  return isFedrampEnv ? shouldRender : true;
};

export default useRenderFedramp;
