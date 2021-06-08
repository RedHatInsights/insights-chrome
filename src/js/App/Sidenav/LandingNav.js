import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { isBeta } from '../../utils';
import './LandingNav.scss';
import { useSelector } from 'react-redux';

const LandingNav = () => {
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }) => !!user);
  const schema = useSelector(({ chrome: { navigation } }) => navigation?.landingPage);
  useEffect(() => {
    if (showNav) {
      setElementReady(true);
    }
  }, [showNav]);
  const isBetaEnv = isBeta();

  /**
   * render navigation only if the user is logged in
   */
  if (!showNav || !elementReady || !schema) {
    return null;
  }

  return (
    <Nav className="ins-c-landing-nav">
      <NavList>
        <div className="ins-c-app-title">
          <b>Hybrid Cloud Console</b>
        </div>
        {schema.map(({ title, id, pathname }) => (
          <NavItem className="ins-m-navigation-align" key={id} to={`${isBetaEnv ? '/beta' : ''}${pathname}`}>
            {title}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default LandingNav;
