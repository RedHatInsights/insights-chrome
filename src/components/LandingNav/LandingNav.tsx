import React, { useEffect, useState } from 'react';
import { Nav, NavList, PageContextConsumer } from '@patternfly/react-core';
import { ITLess, isBeta } from '../../utils/common';
import './LandingNav.scss';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loadNavigationLandingPage } from '../../redux/actions';
import NavLoader from '../Navigation/Loader';
import ChromeNavItemFactory from '../Navigation/ChromeNavItemFactory';
import NavContext from '../Navigation/navContext';
import componentMapper from '../Navigation/componentMapper';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { ReduxState } from '../../redux/store';

const LandingNav = () => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }: ReduxState) => !!user);
  const schema = useSelector(
    ({
      chrome: {
        navigation: { landingPage },
      },
    }: ReduxState) => landingPage
  );
  const modules = useSelector((state: ReduxState) => state.chrome.modules);
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
    <Nav className="chr-c-landing-nav" ouiaId="SideNavigation">
      <NavList>
        <div className="chr-c-app-title">
          <b>{intl.formatMessage(messages.home)}</b>
        </div>
        <PageContextConsumer>
          {({ isNavOpen }) => (
            <NavContext.Provider
              value={{
                componentMapper,
                inPageLayout: true,
                isNavOpen,
              }}
            >
              {schema
                .filter(({ appId }) => (appId && ITLess() ? modules?.[appId]?.isFedramp === true : true))
                .map((item, index) => (
                  <ChromeNavItemFactory key={index} {...item} />
                ))}
            </NavContext.Provider>
          )}
        </PageContextConsumer>
      </NavList>
    </Nav>
  );
};

export default LandingNav;
