import { useEffect, useRef } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import type { NavigateOptions } from 'react-router-dom';
import { getBreadcrumbStore, removeBreadcrumb, setBreadcrumb } from '../state/stores/breadcrumbStore';
import { normalizePathname } from '../utils/breadcrumbUtils';

/**
 * Hook for incrementally adding breadcrumb entries to the app breadcrumb storage.
 * Each route can call this hook independently to register its breadcrumb.
 *
 * The `options` parameter is stabilized internally via JSON serialization,
 * so callers do NOT need to memoize it.
 *
 * @param pathname - Full pathname including bundle prefix (e.g., "/insights/advisor/systems/123")
 * @param title - Breadcrumb title to display
 * @param options - NavigateOptions from react-router (state, replace, preventScrollReset, relative)
 *
 * Exposed as a federated module via Scalprum:
 * @example
 * ```tsx
 * import { useRemoteHook } from '@scalprum/react-core';
 *
 * function SystemDetailPage() {
 *   const { id } = useParams();
 *
 *   useRemoteHook({
 *     scope: 'chrome',
 *     module: './breadcrumbs/useBreadcrumbs',
 *     args: [
 *       `/insights/advisor/systems/${id}`,
 *       `System ${id}`,
 *       { state: { filters: currentFilters } },
 *     ],
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
function useBreadcrumbs(pathname: string, title: string, options?: NavigateOptions): void {
  const isEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const optionsRef = useRef(options);

  // Stabilize options via JSON.stringify, with fallback for circular refs
  let optionsKey: string;
  try {
    optionsKey = JSON.stringify(options);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[useBreadcrumbs] options.state contains circular references — using object reference for comparison. This may cause extra re-renders.');
    }
    // Force re-run on every call when circular refs present
    optionsKey = String(Math.random());
  }

  useEffect(() => {
    optionsRef.current = options;
  }, [optionsKey]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (!pathname || !pathname.startsWith('/')) {
      console.warn(`[useBreadcrumbs] Invalid pathname "${pathname}" - must be absolute path starting with /`);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Non-reactive reads — only used for dev warnings
      const { appMountPathname, replaceMode } = getBreadcrumbStore().getState();

      // Warn if pathname doesn't start with app mount pathname
      if (appMountPathname) {
        const normalizedPathname = normalizePathname(pathname);
        const normalizedAppMount = normalizePathname(appMountPathname);
        if (!normalizedPathname.startsWith(normalizedAppMount)) {
          console.warn(
            `[useBreadcrumbs] pathname "${pathname}" does not start with app mount pathname "${appMountPathname}" - breadcrumbs should be scoped to your app's routes`
          );
        }
      }

      // Warn if replace mode is active — incremental entries will be ignored
      if (replaceMode) {
        console.warn('[useBreadcrumbs] Replace mode is active — incremental entries will be ignored. Use only one hook type per app.');
      }
    }

    const cleanedPathname = normalizePathname(pathname);

    setBreadcrumb(cleanedPathname, { title, options: optionsRef.current });

    return () => {
      removeBreadcrumb(cleanedPathname);
    };
  }, [pathname, title, optionsKey, isEnabled]);
}

export default useBreadcrumbs;
