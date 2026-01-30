import React, { Fragment } from 'react';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';

const NavLoader = () => (
  <Fragment>
    <section className="chr-c-app-switcher--loading">
      <Skeleton isDark={Array.from(document?.documentElement?.classList).includes('pf-v6-theme-dark')} size={SkeletonSize.lg} />
    </section>
    <Nav aria-label="Insights Global Navigation" data-ouia-safe="false" ouiaId="SideNavigation">
      <NavList>
        {[...new Array(4)].map((_i, key) => (
          <NavItem key={key} preventDefault>
            <a href="#">
              <Skeleton isDark={Array.from(document?.documentElement?.classList).includes('pf-v6-theme-dark')} size={SkeletonSize.lg} />
            </a>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  </Fragment>
);

export default NavLoader;
