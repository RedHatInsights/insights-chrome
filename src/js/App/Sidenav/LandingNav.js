import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import useGlobalNav from '../../utils/useGlobalNav';
import { isBeta } from '../../utils';
import NavLoader from './Loader';
import './LandingNav.scss';
import { useSelector } from 'react-redux';

const routes = [
  { title: 'Application Services', id: 'application-services', route: 'application-services' },
  { title: 'OpenShift', id: 'openshift', route: 'openshift' },
  { title: 'Red Hat Enterprise Linux', id: 'insights', route: 'insights/dashboard' },
  { title: 'Ansible Automation Platform', id: 'ansible', route: 'ansible' },
];

const LandingNav = () => {
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }) => !!user);
  useEffect(() => {
    if (showNav) {
      setElementReady(true);
    }
  }, [showNav]);
  const { isLoaded } = useGlobalNav();
  const isBetaEnv = isBeta();

  /**
   * render navigation only if the user is logged in
   */
  if (!showNav || !elementReady) {
    return null;
  }
  return (
    <Nav className="ins-c-landing-nav">
      {!isLoaded ? (
        <NavLoader />
      ) : (
        <NavList>
          <div className="ins-c-app-title">
            <b>Red Hat Hybrid Cloud Console</b>
          </div>
          {routes.map(({ title, id, route }) => (
            <NavItem className="ins-m-navigation-align" key={id} to={`/${isBetaEnv ? 'beta/' : ''}${route}`}>
              {title}
            </NavItem>
          ))}
        </NavList>
      )}
    </Nav>
  );
};

export default LandingNav;
