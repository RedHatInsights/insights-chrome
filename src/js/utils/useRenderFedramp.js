import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { matchPath } from 'react-router-dom';

import { isFedRamp } from '../utils';
const isFedrampEnv = isFedRamp();

export const computeFedrampResult = (isFedrampEnv, linkHref = '', { modules, isFedramp } = { modules: [] }) => {
  /**
   * Render everything on non-fedramp env
   */
  if (!isFedrampEnv) {
    return undefined;
  }

  /**
   * Look for module routes with fedramp flag that match the link
   */
  const configs = modules
    .map(({ routes }) => routes)
    .flat()
    .filter((route) => {
      if (typeof route !== 'object') {
        return false;
      }

      const match = matchPath(linkHref, {
        path: route.pathname,
      });

      return match !== null;
    })
    .filter(({ isFedramp }) => typeof isFedramp === 'boolean');
  const result = configs.length > 0 ? configs.some(({ isFedramp }) => isFedramp === true) : undefined;

  if (typeof result === 'boolean') {
    return result;
  }
  /**
   * Global module setting has the lowest priority
   */
  return isFedramp;
};

const useRenderFedramp = (appId, linkHref) => {
  const module = useSelector(({ chrome: { modules } }) => modules[appId]);
  const [shouldRender, setShouldRender] = useState(() => computeFedrampResult(isFedrampEnv, linkHref, module));

  useEffect(() => {
    setShouldRender(computeFedrampResult(isFedrampEnv, linkHref, module));
  }, [appId, linkHref]);

  return isFedrampEnv ? shouldRender : true;
};

export default useRenderFedramp;
