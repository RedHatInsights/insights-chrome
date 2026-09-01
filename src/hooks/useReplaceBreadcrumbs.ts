import { useEffect, useRef } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { getBreadcrumbStore, setOverride, setReplaceMode } from '../state/stores/breadcrumbStore';
import { type AppBreadcrumbSegment, normalizePathname } from '../utils/breadcrumbUtils';

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
  const isEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbsRef = useRef(breadcrumbs);

  // Stabilize breadcrumbs via JSON.stringify, with fallback for circular refs
  let breadcrumbsKey: string;
  try {
    breadcrumbsKey = JSON.stringify(breadcrumbs);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[useReplaceBreadcrumbs] breadcrumbs array contains circular references — using object reference for comparison. This may cause extra re-renders.'
      );
    }
    // Force re-run on every call when circular refs present
    breadcrumbsKey = String(Math.random());
  }

  useEffect(() => {
    breadcrumbsRef.current = breadcrumbs;
  }, [breadcrumbsKey]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Non-reactive reads — only used for dev warnings
      const { appMountPathname, storage } = getBreadcrumbStore().getState();

      // Warn if any breadcrumb pathname doesn't start with app mount pathname
      if (appMountPathname) {
        const normalizedAppMount = normalizePathname(appMountPathname);
        for (const segment of breadcrumbsRef.current) {
          const normalizedPathname = normalizePathname(segment.pathname);
          if (!normalizedPathname.startsWith(normalizedAppMount)) {
            console.warn(
              `[useReplaceBreadcrumbs] breadcrumb pathname "${segment.pathname}" does not start with app mount pathname "${appMountPathname}" - breadcrumbs should be scoped to your app's routes`
            );
          }
        }
      }

      // Warn if incremental storage exists — it will be ignored
      if (storage.size > 0) {
        console.warn('[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.');
      }
    }

    setReplaceMode(true);
    setOverride(breadcrumbsRef.current);

    return () => {
      setReplaceMode(false);
      setOverride([]);
    };
  }, [breadcrumbsKey, isEnabled]);
}

export default useReplaceBreadcrumbs;
