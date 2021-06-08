import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { isBeta } from '../../utils';
import './LandingNav.scss';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loadNavigationLandingPage } from '../../redux/actions';

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
  useEffect(() => {
    if (showNav) {
      setElementReady(true);
    }
  }, [showNav]);

  /**
   * Load landing page nav
   */
  useEffect(() => {
    axios.get(`${window.location.origin}${isBeta() ? '/beta' : ''}/config/chrome/landing-navigation.json`).then((response) => {
      dispatch(loadNavigationLandingPage(response.data));
    });
  }, []);

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
        {schema.map(({ title, id, href }) => (
          <NavItem className="ins-m-navigation-align" key={id} to={`${isBetaEnv ? '/beta' : ''}${href}`}>
            {title}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

export default LandingNav;
