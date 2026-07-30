import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { appBreadcrumbOverrideAtom, breadcrumbReplaceModeAtom, type AppBreadcrumbSegment } from '../state/atoms/breadcrumbAtom';

/**
 * Hook for replacing the entire app breadcrumb array
 * Use when app has custom breadcrumb logic and wants full control
 * Disables the incremental storage system
 *
 * @param breadcrumbs - Array of breadcrumb segments with pathname, title, and optional NavigateOptions
 *
 * Exposed as a federated module via Scalprum:
 * @example
 * ```tsx
 * import { useRemoteHook } from '@scalprum/react-core';
 *
 * function AppRoot() {
 *   const breadcrumbs = useMemo(() => [
 *     { pathname: '/insights/advisor/systems', title: 'Systems', options: { state: { view: 'list' } } },
 *     { pathname: '/insights/advisor/systems/123', title: 'System 123', options: { state: { filters } } },
 *   ], [filters]);
 *
 *   useRemoteHook({
 *     scope: 'chrome',
 *     module: './breadcrumbs/useReplaceBreadcrumbs',
 *     args: [breadcrumbs],
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
function useReplaceBreadcrumbs(breadcrumbs: AppBreadcrumbSegment[]): void {
  const setReplaceMode = useSetAtom(breadcrumbReplaceModeAtom);
  const setOverride = useSetAtom(appBreadcrumbOverrideAtom);
  const isEnabled = useFlag('platform.chrome.app-breadcrumbs');

  useEffect(() => {
    // Feature flag disabled - no-op
    if (!isEnabled) {
      return;
    }

    // Enable replace mode
    setReplaceMode(true);

    // Set override array
    setOverride(breadcrumbs);

    // Cleanup - disable replace mode when component unmounts
    return () => {
      setReplaceMode(false);
      setOverride([]);
    };
  }, [breadcrumbs, setReplaceMode, setOverride, isEnabled]);
}

export default useReplaceBreadcrumbs;
