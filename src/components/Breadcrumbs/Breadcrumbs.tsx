import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';

import React, { useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { useLocation } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';
import { OpenShiftIntercomModule } from '../OpenShiftIntercom';
import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';
import ChromeLink from '../ChromeLink/ChromeLink';
import classNames from 'classnames';
import BreadcrumbsFavorites from './BreadcrumbsFavorites';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { appBreadcrumbOverrideAtom, appBreadcrumbSegmentsAtom, breadcrumbPathnameAtom, breadcrumbReplaceModeAtom } from '../../state/atoms/breadcrumbAtom';

export type Breadcrumbsprops = {
  isNavOpen?: boolean;
  hideNav?: boolean;
  setIsNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

type BreadcrumbSegment = {
  title?: string;
  href?: string;
  options?: NavigateOptions;
};

const Breadcrumbs = () => {
  const chromeSegments = useBreadcrumbsLinks();
  const isAppBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const appSegments = useAtomValue(appBreadcrumbSegmentsAtom);
  const appOverride = useAtomValue(appBreadcrumbOverrideAtom);
  const isReplaceMode = useAtomValue(breadcrumbReplaceModeAtom);
  const setPathname = useSetAtom(breadcrumbPathnameAtom);
  const { pathname } = useLocation();
  const { favoritePages, favoritePage, unfavoritePage } = useFavoritePagesWrapper();

  useEffect(() => {
    setPathname(pathname);
  }, [pathname, setPathname]);

  // Merge chrome + app breadcrumbs
  const segments = useMemo<BreadcrumbSegment[]>(() => {
    const finalAppSegments = (isAppBreadcrumbsEnabled ? (isReplaceMode ? appOverride : appSegments) : []) ?? [];

    if (finalAppSegments.length === 0) {
      return chromeSegments.map((seg) => ({
        title: seg.title,
        href: seg.href,
        options: undefined,
      }));
    }

    // Get app mount pathname from first app segment (should include bundle + app, e.g., "/insights/advisor")
    // Extract app mount by taking pathname up to app level (remove everything after app name)
    const firstAppSegment = finalAppSegments[0]?.pathname;
    let appMountPathname: string | undefined;

    if (firstAppSegment) {
      const parts = firstAppSegment.split('/').filter(Boolean);
      // App mount is /{bundle}/{app} — first 2 non-empty parts
      if (parts.length >= 2) {
        appMountPathname = `/${parts[0]}/${parts[1]}`;
      }
    }

    // Omit last chrome segment if:
    // 1. App breadcrumbs exist
    // 2. Last chrome segment is NOT the app mount pathname (design requirement)
    const lastChromeSegment = chromeSegments[chromeSegments.length - 1];
    const chromeToUse =
      chromeSegments.length > 1 && appMountPathname && lastChromeSegment?.href !== appMountPathname ? chromeSegments.slice(0, -1) : chromeSegments;

    // Merge chrome + app segments
    return [
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
  }, [chromeSegments, isAppBreadcrumbsEnabled, isReplaceMode, appOverride, appSegments]);

  const leafHref = segments[segments.length - 1]?.href;
  const isFavorited = useMemo(() => favoritePages.find(({ pathname, favorite }) => favorite && pathname === leafHref), [favoritePages, leafHref]);

  useEffect(() => {
    setisOpenshift(segments[0] && segments[0].title === 'OpenShift');
  }, [segments]);
  const [isOpenshift, setisOpenshift] = useState(false);

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
        {leafHref && (
          <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }}>
            <BreadcrumbsFavorites favoritePage={() => favoritePage(leafHref)} unfavoritePage={() => unfavoritePage(leafHref)} isFavorited={!!isFavorited} />
          </FlexItem>
        )}
      </div>
    </PageBreadcrumb>
  );
};

export default Breadcrumbs;
