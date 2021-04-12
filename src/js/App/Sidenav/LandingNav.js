import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { isBeta, getEnv } from '../../utils';
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
  const isBetaEnv = isBeta();

  /**
   * render navigation only if the user is logged in
   */
  if (!showNav || !elementReady) {
    return null;
  }
  return (
    <Nav className="ins-c-landing-nav">
      <NavList>
        <div className="ins-c-app-title">
          <b>Hybrid Cloud Console</b>
        </div>
        {routes
          .filter(({ key }) => key !== 'application-services' || (isBeta() && ['ci', 'qa', 'stage'].includes(getEnv())))
          .map(({ title, id, route }) => (
            <NavItem className="ins-m-navigation-align" key={id} to={`/${isBetaEnv ? 'beta/' : ''}${route}`}>
              {title}
            </NavItem>
          ))}
      </NavList>
    </Nav>
  );
};

export default LandingNav;
