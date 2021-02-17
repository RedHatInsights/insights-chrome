import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import useGlobalNav from '../../utils/useGlobalNav';
import { isBeta } from '../../utils';
import NavLoader from './Loader';
import './LandingNav.scss';
import { useSelector } from 'react-redux';

const routes = [
  { title: 'Application Services', id: 'application-services' },
  { title: 'OpenShift', id: 'openshift' },
  { title: 'Red Hat Enterprise Linux', id: 'insights/dashboard' },
  { title: 'Ansible Automation Platform', id: 'ansible' },
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
          {routes.map(({ title, id }) => (
            <NavItem className="ins-m-navigation-align" key={id} to={`/${isBetaEnv ? 'beta/' : ''}${id}`}>
              {title}
            </NavItem>
          ))}
        </NavList>
      )}
    </Nav>
  );
};

export default LandingNav;
