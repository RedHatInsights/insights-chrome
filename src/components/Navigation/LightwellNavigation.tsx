import React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { useLocation } from 'react-router-dom';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { LIGHTWELL_PATH } from '../../utils/common';

// TODO: RHCLOUD-50417 — Temporary hardcoded horizontal navigation for Lightwell.
// Remove once the generic flat navigation feature is built.
const LIGHTWELL_NAV_ITEMS = [
  { label: 'Repositories', path: LIGHTWELL_PATH },
  { label: 'Lens', path: `${LIGHTWELL_PATH}/lens` },
  { label: 'Beacon', path: `${LIGHTWELL_PATH}/beacon` },
] as const;

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
 * Lightwell-specific horizontal navigation rendered via PF6 Page's
 * horizontalSubnav prop, which places it inside the main container
 * and ensures proper alignment at all viewport widths.
 */
const LightwellNavigation = (): React.JSX.Element => {
  const { pathname } = useLocation();
  const activeNav = getActiveLightwellNav(pathname);

  return (
    <Nav variant="horizontal-subnav" aria-label="Lightwell navigation">
      <NavList>
        {LIGHTWELL_NAV_ITEMS.map(({ label, path }) => (
          <NavItem key={path} isActive={activeNav === path} to={path} component={(props: LinkWrapperProps) => <ChromeLink {...props} href={path} />}>
            {label}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default LightwellNavigation;
