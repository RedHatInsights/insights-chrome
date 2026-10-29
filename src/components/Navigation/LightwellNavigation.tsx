import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { useLocation } from 'react-router-dom';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { getUrl } from '../../hooks/useBundle';
import { getLightwellBasePath } from '../../utils/common';
import { isNavItemVisible } from '../../utils/isNavItemVisible';
import { NavItemPermission } from '../../@types/types';

const CONTENT_SOURCES_FEATURES_URL = '/api/content-sources/v1.0/features/';

interface LightwellNavItemConfig {
  label: string;
  /** Path segment after the shell prefix. Empty for the shell root. */
  segment: string;
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
 * Each item gated behind the content-sources features API.
 *
 * | Nav Item       | Feature Key     | Accessor                     |
 * |----------------|-----------------|------------------------------|
 * | Repositories   | lightwell       | lightwell.accessible         |
 * | Lens           | lightwelllens   | lightwelllens.accessible     |
 * | Beacon         | lightwellbeacon | lightwellbeacon.accessible   |
 */
const NAV_ITEMS: LightwellNavItemConfig[] = [
  { label: 'Repositories', segment: '', permissions: featuresPermission('lightwell.accessible') },
  { label: 'Lens', segment: 'lens', permissions: featuresPermission('lightwelllens.accessible') },
  { label: 'Beacon', segment: 'beacon', permissions: featuresPermission('lightwellbeacon.accessible') },
];

const navPath = (basePath: string, segment: string): string => (segment ? `${basePath}/${segment}` : basePath);

/**
 * Determine which Lightwell nav item is active based on pathname.
 * Checks specific sub-routes first; falls back to Repositories (root).
 * `basePath` is the shell prefix the user opened (`/lightwell` or `/lightwell-next`).
 */
const getActiveLightwellNav = (pathname: string, basePath: string): string => {
  const lensPath = navPath(basePath, 'lens');
  const beaconPath = navPath(basePath, 'beacon');
  if (pathname === lensPath || pathname.startsWith(`${lensPath}/`)) return lensPath;
  if (pathname === beaconPath || pathname.startsWith(`${beaconPath}/`)) return beaconPath;
  return basePath;
};

/**
 * Lightwell-specific horizontal navigation. Items are gated behind the
 * content-sources features API (`/api/content-sources/v1.0/features/`)
 * using the built-in `apiRequest` visibility function with an `accessor` to
 * extract the `accessible` boolean.
 */
const LightwellNavigation = (): React.JSX.Element | null => {
  const { pathname } = useLocation();
  const basePath = getLightwellBasePath(getUrl('bundle', pathname));
  const [visibleItems, setVisibleItems] = useState<LightwellNavItemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const evaluatePermissions = async () => {
      const results = await Promise.all(
        NAV_ITEMS.map(async (item) => {
          if (!item.permissions) {
            return { item, visible: true };
          }
          try {
            const visible = await isNavItemVisible(item.permissions, { source: 'lightwell', itemId: item.label });
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
  }, []);

  // Hide while loading permissions and when only one item remains (no tabs needed)
  if (isLoading || visibleItems.length <= 1) {
    return null;
  }

  const activeNav = getActiveLightwellNav(pathname, basePath);

  return (
    <Nav variant="horizontal-subnav" aria-label="Lightwell navigation">
      <NavList>
        {visibleItems.map((item) => {
          const path = navPath(basePath, item.segment);
          return (
            <NavItem key={item.label} isActive={activeNav === path} to={path} component={(props: LinkWrapperProps) => <ChromeLink {...props} href={path} />}>
              {item.label}
            </NavItem>
          );
        })}
      </NavList>
    </Nav>
  );
};

export default LightwellNavigation;
