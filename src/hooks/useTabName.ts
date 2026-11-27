import { useAtomValue } from 'jotai';
import { useLocation } from 'react-router-dom';

import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import useBreadcrumbsLinks from './useBreadcrumbsLinks';
import useBundle from './useBundle';
import { useEffect, useMemo } from 'react';
import { chromeModulesAtom } from '../state/atoms/chromeModuleAtom';
import { feoMessagesAtom } from '../state/atoms/feoLocaleAtom';
import { localizeModuleTitle } from '../utils/feoLocalization';

const useTabName = () => {
  const { bundleTitle } = useBundle();
  const messages = useAtomValue(feoMessagesAtom);
  const modules = useAtomValue(chromeModulesAtom);
  const activeModule = useAtomValue(activeModuleAtom);
  const { pathname } = useLocation();
  const fragments = useBreadcrumbsLinks();

  const title = useMemo(() => {
    const fragmentsWithoutBundle = fragments
      .slice(2) // remove the root and bundle breadcrumbs
      .slice(-2) // limit to closest link parent
      .map(({ title }) => title);
    // toReversed is not properly supported in all envs we run this code
    fragmentsWithoutBundle.reverse();
    const moduleTitle = activeModule && modules[activeModule]?.defaultDocumentTitle;
    const breadcrumbTitle = fragmentsWithoutBundle.join(' - ');
    // Overlay a module title only when already used by the English breadcrumbs;
    // do not introduce a new fallback for routes without breadcrumbs.
    const titleText =
      breadcrumbTitle && activeModule && moduleTitle === breadcrumbTitle ? localizeModuleTitle(breadcrumbTitle, activeModule, messages) : breadcrumbTitle;
    return `${titleText} | ${bundleTitle}`;
  }, [activeModule, pathname, fragments, bundleTitle, modules, messages]);
  useEffect(() => {
    // sometimes the nav files are not loaded yet and the first section is empty
    if (title.split(' | ')[0].trim().length > 0) {
      document.title = title;
    }
  }, [title]);
};

export default useTabName;
