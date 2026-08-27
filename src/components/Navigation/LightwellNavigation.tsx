import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { useLocation } from 'react-router-dom';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { LIGHTWELL_PATH, isProd } from '../../utils/common';
import { isNavItemVisible } from '../../utils/isNavItemVisible';
import { NavItemPermission } from '../../@types/types';

const CONTENT_SOURCES_FEATURES_URL = '/api/content-sources/v1.0/features/';

interface LightwellNavItemConfig {
  label: string;
  path: string;
  permissions?: NavItemPermission<'apiRequest'>[];
}

/**
 * Create an apiRequest permission entry for the content-sources features API.
 * The accessor path extracts the `accessible` boolean from the response.
 */
const featuresPermission = (accessor: string): LightwellNavItemConfig['permissions'] => [
  { method: 'apiRequest', args: [{ url: CONTENT_SOURCES_FEATURES_URL, accessor }] },
];

/**
 * Stage/dev: no permissions — all three tabs visible to everyone, no API calls.
 */
const STAGE_NAV_ITEMS: LightwellNavItemConfig[] = [
  { label: 'Repositories', path: LIGHTWELL_PATH },
  { label: 'Lens', path: `${LIGHTWELL_PATH}/lens` },
  { label: 'Beacon', path: `${LIGHTWELL_PATH}/beacon` },
];

/**
 * Production: each item gated behind the content-sources features API.
 *
 * | Nav Item       | Feature Key     | Accessor                     |
 * |----------------|-----------------|------------------------------|
 * | Repositories   | lightwell       | lightwell.accessible         |
 * | Lens           | lightwelllens   | lightwelllens.accessible     |
 * | Beacon         | lightwellbeacon | lightwellbeacon.accessible   |
 */
const PROD_NAV_ITEMS: LightwellNavItemConfig[] = [
  { label: 'Repositories', path: LIGHTWELL_PATH, permissions: featuresPermission('lightwell.accessible') },
  { label: 'Lens', path: `${LIGHTWELL_PATH}/lens`, permissions: featuresPermission('lightwelllens.accessible') },
  { label: 'Beacon', path: `${LIGHTWELL_PATH}/beacon`, permissions: featuresPermission('lightwellbeacon.accessible') },
];

/**
 * Determine which Lightwell nav item is active based on pathname.
 * Checks specific sub-routes first; falls back to Repositories (root).
 */
const getActiveLightwellNav = (pathname: string): string => {
  if (pathname === `${LIGHTWELL_PATH}/lens` || pathname.startsWith(`${LIGHTWELL_PATH}/lens/`)) return `${LIGHTWELL_PATH}/lens`;
  if (pathname === `${LIGHTWELL_PATH}/beacon` || pathname.startsWith(`${LIGHTWELL_PATH}/beacon/`)) return `${LIGHTWELL_PATH}/beacon`;
  return LIGHTWELL_PATH;
};

/**
 * Lightwell-specific horizontal navigation. In production, items are gated
 * behind the content-sources features API (`/api/content-sources/v1.0/features/`)
 * using the built-in `apiRequest` visibility function with an `accessor` to
 * extract the `accessible` boolean. In stage/dev, all items are visible
 * without API calls.
 */
const LightwellNavigation = (): React.JSX.Element | null => {
  const { pathname } = useLocation();
  const isProduction = isProd();
  const navItems = isProduction ? PROD_NAV_ITEMS : STAGE_NAV_ITEMS;

  // Stage items have no permissions → show immediately, not loading.
  // Prod items require API verification → start empty, loading until resolved.
  const [visibleItems, setVisibleItems] = useState<LightwellNavItemConfig[]>(() => (isProduction ? [] : navItems));
  const [isLoading, setIsLoading] = useState(isProduction);

  useEffect(() => {
    if (!isProduction) {
      return;
    }

    let cancelled = false;

    const evaluatePermissions = async () => {
      const results = await Promise.all(
        navItems.map(async (item) => {
          if (!item.permissions) {
            return { item, visible: true };
          }
          try {
            const visible = await isNavItemVisible(item.permissions);
            return { item, visible };
          } catch {
            return { item, visible: false };
          }
        })
      );

      if (!cancelled) {
        setVisibleItems(results.filter(({ visible }) => visible).map(({ item }) => item));
        setIsLoading(false);
      }
    };

    evaluatePermissions();

    return () => {
      cancelled = true;
    };
  }, [isProduction]);

  // Hide while loading permissions and when only one item remains (no tabs needed)
  if (isLoading || visibleItems.length <= 1) {
    return null;
  }

  const activeNav = getActiveLightwellNav(pathname);

  return (
    <Nav variant="horizontal-subnav" aria-label="Lightwell navigation">
      <NavList>
        {visibleItems.map(({ label, path }) => (
          <NavItem key={path} isActive={activeNav === path} to={path} component={(props: LinkWrapperProps) => <ChromeLink {...props} href={path} />}>
            {label}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default LightwellNavigation;
