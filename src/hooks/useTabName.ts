import { useAtomValue } from 'jotai';
import { useLocation } from 'react-router-dom';

import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import useBreadcrumbsLinks from './useBreadcrumbsLinks';
import useBundle from './useBundle';
import { useEffect, useMemo } from 'react';

const useTabName = () => {
  const { bundleTitle } = useBundle();
  const activeModule = useAtomValue(activeModuleAtom);
  const { pathname } = useLocation();
  const fragments = useBreadcrumbsLinks();

  const title = useMemo(() => {
    const fragmentsWithoutBundle = fragments
      .slice(1) // remove the bundle
      .slice(-2) // limit to closest link parent
      .map(({ title }) => title);
    // toReversed is not properly supported in all envs we run this code
    fragmentsWithoutBundle.reverse();
    return `${fragmentsWithoutBundle.join(' - ')} | ${bundleTitle}`;
  }, [activeModule, pathname, fragments]);
  useEffect(() => {
    // sometimes the nav files are not loaded yet and the first section is empty
    if (title.split(' | ')?.[0].length > 1) {
      document.title = title;
    }
  }, [title]);
};

export default useTabName;
