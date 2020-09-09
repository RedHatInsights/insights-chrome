import React, { Fragment } from 'react';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/components/cjs/Skeleton';
import { Nav } from '@patternfly/react-core/dist/js/components/Nav/Nav';
import  { NavList } from '@patternfly/react-core/dist/js/components/Nav/NavList';
import NavigationItem from './NavigationItem';

const NavLoader = () => (
    <Fragment>
        <section className={'ins-c-app-switcher--loading'}>
            <Skeleton size={SkeletonSize.lg} className="ins-m-dark"/>
        </section>
        <Nav aria-label="Insights Global Navigation" data-ouia-safe="false">
            <NavList>
                {[...new Array(4)].map((_i, key) => (
                    <NavigationItem
                        key={key}
                        title={<a className="ins-c-skeleton__link">
                            <Skeleton size={SkeletonSize.lg} className="ins-m-dark"/>
                        </a>}
                    />))}
            </NavList>
        </Nav>
    </Fragment>
);

export default NavLoader;
