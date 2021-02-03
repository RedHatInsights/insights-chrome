import React from 'react';
import { Nav, NavExpandable, NavItem, NavList } from '@patternfly/react-core';
import useGlobalNav from '../../utils/useGlobalNav';
import { isBeta } from '../../utils';
import NavLoader from './Loader';
import './LandingNav.scss';

const LandingNav = () => {
  const { apps } = useGlobalNav();
  const isBetaEnv = isBeta();

  return (
    <Nav className="pf-m-dark pf-c-page__sidebar ins-c-landing-nav">
      {apps.length === 0 ? (
        <NavLoader />
      ) : (
        <NavList>
          <NavItem preventDefault component="span">
            <b>Red Hat Hybrid Cloud Console</b>
          </NavItem>
          {apps.map(({ id, title, routes }) => (
            <NavExpandable className="ins-m-navigation-align" key={id} title={title}>
              {routes.map(({ title, id: path }) => (
                <NavItem className="ins-m-navigation-align" key={id} to={`/${isBetaEnv ? 'beta/' : ''}${id}/${path}`}>
                  {title}
                </NavItem>
              ))}
            </NavExpandable>
          ))}
        </NavList>
      )}
    </Nav>
  );
};

export default LandingNav;
