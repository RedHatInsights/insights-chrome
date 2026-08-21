import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { useLocation } from 'react-router-dom';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { LIGHTWELL_PATH } from '../../utils/common';
import { isNavItemVisible } from '../../utils/isNavItemVisible';
import { NavItemPermission } from '../../@types/types';

const CONTENT_SOURCES_FEATURES_URL = '/api/content-sources/v1.0/features/';
const LENS_PATH = `${LIGHTWELL_PATH}/lens`;
const BEACON_PATH = `${LIGHTWELL_PATH}/beacon`;

const featuresPermission = (accessor: string): NavItemPermission<'apiRequest'>[] => [
  { method: 'apiRequest', args: [{ url: CONTENT_SOURCES_FEATURES_URL, accessor }] },
];

const LIGHTWELL_PERMISSION = featuresPermission('lightwell.accessible');
const LENS_AND_BEACON_PERMISSION = featuresPermission('lightwellbeaconandlens.accessible');

const NAV_ITEMS = [
  { label: 'Repositories', path: LIGHTWELL_PATH },
  { label: 'Lens', path: LENS_PATH },
  { label: 'Beacon', path: BEACON_PATH },
];

/**
 * Determine which Lightwell nav item is active based on pathname.
 * Checks specific sub-routes first; falls back to Repositories (root).
 */
const getActiveLightwellNav = (pathname: string): string => {
  if (pathname === LENS_PATH || pathname.startsWith(`${LENS_PATH}/`)) return LENS_PATH;
  if (pathname === BEACON_PATH || pathname.startsWith(`${BEACON_PATH}/`)) return BEACON_PATH;
  return LIGHTWELL_PATH;
};

const isFeatureAccessible = async (permissions: NavItemPermission<'apiRequest'>[]): Promise<boolean> => {
  try {
    return await isNavItemVisible(permissions);
  } catch {
    return false;
  }
};

/**
 * Lightwell-specific horizontal navigation. Shown only when both content-sources
 * features are accessible (`/api/content-sources/v1.0/features/`):
 * `lightwell.accessible` and `lightwellbeaconandlens.accessible`.
 * Otherwise the bar is omitted (including while permissions load).
 */
const LightwellNavigation = (): React.JSX.Element | null => {
  const { pathname } = useLocation();
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const evaluatePermissions = async () => {
      const [hasLightwell, hasLensAndBeacon] = await Promise.all([isFeatureAccessible(LIGHTWELL_PERMISSION), isFeatureAccessible(LENS_AND_BEACON_PERMISSION)]);

      if (!cancelled) {
        setShowNav(hasLightwell && hasLensAndBeacon);
      }
    };

    evaluatePermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!showNav) {
    return null;
  }

  const activeNav = getActiveLightwellNav(pathname);

  return (
    <Nav className="chr-c-page-subnav" variant="horizontal-subnav" aria-label="Lightwell navigation">
      <NavList>
        {NAV_ITEMS.map(({ label, path }) => (
          <NavItem key={path} isActive={activeNav === path} to={path} component={(props: LinkWrapperProps) => <ChromeLink {...props} href={path} />}>
            {label}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default LightwellNavigation;
