import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useLocation } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';
import { Required } from 'utility-types';
import { useGetState } from '@scalprum/react-core';
import { useAtomValue } from 'jotai';
import { OpenShiftIntercomModule } from '../OpenShiftIntercom';
import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import classNames from 'classnames';
import BreadcrumbsFavorites from './BreadcrumbsFavorites';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { NavItem } from '../../@types/types';
import { useBreadcrumbStoreRef } from '../../chrome/breadcrumbStoreBridge';
import { type BreadcrumbStore } from '../../state/stores/breadcrumbStore';
import { type AppBreadcrumbSegment, buildBreadcrumbSegments, normalizePathname } from '../../utils/breadcrumbUtils';
import { layoutLightwellShellAtom } from '../../state/atoms/releaseAtom';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

type ChromeBreadcrumbSegment = Required<NavItem, 'href'>;

type BreadcrumbSegment = {
  title?: string;
  href?: string;
  options?: NavigateOptions;
};

/**
 * Merge Chrome-native breadcrumb segments with app-provided segments.
 *
 * Chrome segments are ALWAYS present. App segments are purely additive: when the
 * app provides nothing (`finalAppSegments` empty) the result is exactly the Chrome
 * segments — identical to the pre-app-breadcrumbs behavior.
 */
function mergeBreadcrumbSegments(
  chromeSegments: ChromeBreadcrumbSegment[],
  finalAppSegments: AppBreadcrumbSegment[],
  appMountPathname: string | undefined
): BreadcrumbSegment[] {
  if (finalAppSegments.length === 0) {
    return chromeSegments.map((seg) => ({
      title: seg.title,
      href: seg.href,
      options: undefined,
    }));
  }

  // Omit last chrome segment if:
  // 1. App breadcrumbs exist
  // 2. Last chrome segment is NOT the app mount pathname (design requirement)
  // 3. App's first breadcrumb matches or extends the last chrome segment (prevents gaps)
  // appMountPathname is set by ChromeRoute from the route path (e.g., '/settings', '/insights/advisor')
  const lastChromeSegment = chromeSegments[chromeSegments.length - 1];
  const firstAppSegment = finalAppSegments[0];

  // Check if app's first breadcrumb matches or extends (immediate child only) the last Chrome segment
  let shouldDropLastChromeSegment = false;
  if (chromeSegments.length > 1 && appMountPathname && lastChromeSegment?.href !== appMountPathname && firstAppSegment && lastChromeSegment?.href) {
    const normalizedAppFirst = normalizePathname(firstAppSegment.pathname);
    const normalizedChromeLast = normalizePathname(lastChromeSegment.href);

    // Exact match
    if (normalizedAppFirst === normalizedChromeLast) {
      shouldDropLastChromeSegment = true;
    }
    // Immediate child (extends by exactly one segment)
    else if (normalizedAppFirst.startsWith(normalizedChromeLast + '/')) {
      const remaining = normalizedAppFirst.slice(normalizedChromeLast.length + 1);
      // Check if there's only one more segment (no additional slashes)
      if (!remaining.includes('/')) {
        shouldDropLastChromeSegment = true;
      }
    }
  }

  const chromeToUse = shouldDropLastChromeSegment ? chromeSegments.slice(0, -1) : chromeSegments;

  // Merge chrome + app segments
  const mergedSegments: BreadcrumbSegment[] = [
    ...chromeToUse.map((seg) => ({
      title: seg.title,
      href: seg.href,
      options: undefined,
    })),
    ...finalAppSegments.map((seg) => ({
      title: seg.title,
      href: seg.pathname,
      options: seg.options,
    })),
  ];

  // Warn about duplicate hrefs with conflicting titles in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const hrefToTitles = new Map<string, string[]>();
    for (const segment of mergedSegments) {
      if (segment.href) {
        const titles = hrefToTitles.get(segment.href) || [];
        if (segment.title && !titles.includes(segment.title)) {
          titles.push(segment.title);
        }
        hrefToTitles.set(segment.href, titles);
      }
    }

    for (const [href, titles] of hrefToTitles.entries()) {
      if (titles.length > 1) {
        console.warn(
          `[Breadcrumbs] Duplicate breadcrumb href "${href}" with conflicting titles: "${titles.join('", "')}" - app breadcrumb may conflict with Chrome segment`
        );
      }
    }
  }

  return mergedSegments;
}

/**
 * Presentational breadcrumb renderer. Receives the already-merged segments and is
 * shared by both the chrome-only fallback and the app-aware paths, so Chrome
 * breadcrumbs look and behave identically regardless of store state.
 */
const BreadcrumbsView = ({ segments }: { segments: BreadcrumbSegment[] }) => {
  const { favoritePages, favoritePage, unfavoritePage } = useFavoritePagesWrapper();
  const isLightwellShell = useAtomValue(layoutLightwellShellAtom);
  const [isOpenshift, setisOpenshift] = useState(false);

  const leafHref = segments[segments.length - 1]?.href;
  const isFavorited = useMemo(() => favoritePages.find(({ pathname, favorite }) => favorite && pathname === leafHref), [favoritePages, leafHref]);

  useEffect(() => {
    setisOpenshift(!!segments[0] && segments[0].title === 'OpenShift');
  }, [segments]);

  return (
    <PageBreadcrumb hasBodyWrapper={false} className="chr-c-breadcrumbs pf-v6-u-p-0 pf-v6-u-w-100">
      <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-pt-sm pf-v6-u-pb-0 pf-v6-u-pl-lg">
        <FlexItem className="pf-v6-u-flex-grow-1">
          <Breadcrumb className="pf-v6-u-pt-sm">
            {segments.map(({ title, href, options }, index) => {
              if (!href || !title) return null;
              return (
                <BreadcrumbItem
                  to={href}
                  component={(props) => (
                    <ChromeLink
                      {...props}
                      className={classNames(props.className, 'chr-c-breadcrumbs__link')}
                      title={title}
                      href={href}
                      state={options?.state}
                      replace={options?.replace}
                      preventScrollReset={options?.preventScrollReset}
                    />
                  )}
                  key={index}
                  isActive={segments.length - 1 === index}
                  className="pf-v6-u-pb-sm"
                >
                  {title}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </FlexItem>
        {isOpenshift && (
          <FlexItem>
            <OpenShiftIntercomModule />
          </FlexItem>
        )}
        {!isLightwellShell && leafHref && (
          <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }}>
            <BreadcrumbsFavorites favoritePage={() => favoritePage(leafHref)} unfavoritePage={() => unfavoritePage(leafHref)} isFavorited={!!isFavorited} />
          </FlexItem>
        )}
      </div>
    </PageBreadcrumb>
  );
};

/**
 * App-aware path — only rendered once the breadcrumb store has resolved. Reads the
 * store reactively and merges app segments on top of the Chrome segments. When the
 * app provided no breadcrumbs, the merge returns the Chrome segments unchanged.
 */
const BreadcrumbsWithApp = ({ store, chromeSegments, pathname }: { store: BreadcrumbStore; chromeSegments: ChromeBreadcrumbSegment[]; pathname: string }) => {
  const { storage, replaceMode, override, appMountPathname } = useGetState(store);

  // Sync pathname before paint to prevent breadcrumb flicker on navigation
  useLayoutEffect(() => {
    store.updateState('SET_PATHNAME', pathname);
  }, [pathname, store]);

  const appSegments = useMemo<AppBreadcrumbSegment[]>(
    () => (replaceMode ? override : buildBreadcrumbSegments(storage, pathname)),
    [replaceMode, override, storage, pathname]
  );

  const segments = useMemo<BreadcrumbSegment[]>(
    () => mergeBreadcrumbSegments(chromeSegments, appSegments, appMountPathname),
    [chromeSegments, appSegments, appMountPathname]
  );

  return <BreadcrumbsView segments={segments} />;
};

const Breadcrumbs = () => {
  // Unconditional hooks — chrome-native breadcrumbs are never gated on the store.
  const store = useBreadcrumbStoreRef();
  const chromeSegments = useBreadcrumbsLinks();
  const isAppBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const { pathname } = useLocation();

  // Fallback path: store not yet loaded OR feature disabled. Renders exactly the
  // Chrome segments — this is a fully-functional flow, not a loading placeholder.
  if (!store || !isAppBreadcrumbsEnabled) {
    const chromeOnly = chromeSegments.map((seg) => ({ title: seg.title, href: seg.href, options: undefined }));
    return <BreadcrumbsView segments={chromeOnly} />;
  }

  return <BreadcrumbsWithApp store={store} chromeSegments={chromeSegments} pathname={pathname} />;
};

export default Breadcrumbs;
