import React, { Fragment } from 'react';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { Nav, NavList, NavItem } from '@patternfly/react-core';

const NavLoader = () => (
  <Fragment>
    <section className={'ins-c-app-switcher--loading'}>
      <Skeleton size={SkeletonSize.lg} className="ins-m-dark" />
    </section>
    <Nav aria-label="Insights Global Navigation" data-ouia-safe="false">
      <NavList>
        {[...new Array(4)].map((_i, key) => (
          <NavItem
            className="ins-c-navigation__additional-links"
            key={key}
            preventDefault
            title={<Skeleton size={SkeletonSize.lg} className="ins-m-dark ins-c-skeleton__link" />}
          />
        ))}
      </NavList>
    </Nav>
  </Fragment>
);

export default NavLoader;
