import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { isBeta, isFedRamp } from '../../utils';
import './LandingNav.scss';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loadNavigationLandingPage } from '../../redux/actions';
import NavLoader from './Navigation/Loader';
import ChromeLink from './Navigation/ChromeLink';

const LandingNav = () => {
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }) => !!user);
  const schema = useSelector(
    ({
      chrome: {
        navigation: { landingPage },
      },
    }) => landingPage
  );
  const modules = useSelector((state) => state.chrome.modules);
  useEffect(() => {
    if (showNav) {
      setElementReady(true);
    }
  }, [showNav]);

  useEffect(() => {
    axios.get(`${window.location.origin}${isBeta() ? '/beta' : ''}/config/chrome/landing-navigation.json`).then((response) => {
      dispatch(loadNavigationLandingPage(response.data));
    });
  }, []);

  /**
   * render navigation only if the user is logged in
   */
  if (!showNav || !elementReady || !schema) {
    return <NavLoader />;
  }

  return (
    <Nav className="ins-c-landing-nav" ouiaId="SideNavigation">
      <NavList>
        <div className="ins-c-app-title">
          <b>Home</b>
        </div>
        {schema
          .filter(({ appId }) => isFedRamp() && modules[appId]?.isFedramp === true)
          .map(({ title, id, href, appId }) => (
            <NavItem
              component={(props) => <ChromeLink {...props} isBeta={isBetaEnv} appId={appId} />}
              className="ins-m-navigation-align"
              key={id}
              ouiaId={id}
              to={href}
            >
              {title}
            </NavItem>
          ))}
      </NavList>
    </Nav>
  );
};

export default LandingNav;
