import React, { useEffect, useRef } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { NavLink, useLocation } from 'react-router-dom';
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
 * Lightwell-specific horizontal navigation rendered between the masthead
 * and the felt-theme white card container.
 *
 * PF6 Page uses CSS grid with named areas "header" and "main". There is no
 * built-in slot between them. This component injects a "subnav" area into
 * the grid template so the nav renders in the gray page background, outside
 * the white card container. Cleanup restores the original grid on unmount.
 */
const LightwellNavigation = () => {
  const { pathname } = useLocation();
  const activeNav = getActiveLightwellNav(pathname);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const page = el.closest('.pf-v6-c-page') as HTMLElement | null;
    if (!page) return;

    const origAreas = page.style.gridTemplateAreas;
    const origRows = page.style.gridTemplateRows;

    // Insert a "subnav" named area between "header" and "main"
    page.style.gridTemplateAreas = '"header" "subnav" "main"';
    page.style.gridTemplateRows = 'auto auto 1fr';

    return () => {
      page.style.gridTemplateAreas = origAreas;
      page.style.gridTemplateRows = origRows;
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ gridArea: 'subnav' }}>
      <Nav variant="horizontal-subnav" aria-label="Lightwell navigation">
        <NavList>
          {LIGHTWELL_NAV_ITEMS.map(({ label, path }) => (
            <NavItem
              key={path}
              isActive={activeNav === path}
              to={path}
              component={({ className: navClassName, children, ...rest }) => (
                <NavLink to={path} className={navClassName} {...rest}>
                  {children}
                </NavLink>
              )}
            >
              {label}
            </NavItem>
          ))}
        </NavList>
      </Nav>
    </div>
  );
};

export default LightwellNavigation;
