import React, { useEffect, useState } from 'react';
import { Nav, NavList, PageContextConsumer } from '@patternfly/react-core';
import { isBeta, isFedRamp } from '../../utils';
import './LandingNav.scss';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loadNavigationLandingPage } from '../../redux/actions';
import NavLoader from './Navigation/Loader';
import ChromeNavItemFactory from './Navigation/ChromeNavItemFactory';
import NavContext from './Navigation/navContext';
import componentMapper from './Navigation/componentMapper';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

import {
  NavExpandable,
  NavItem,
  NavItemSeparator,
  NavGroup,
  Menu,
  MenuContent,
  MenuList,
  MenuItem
} from '@patternfly/react-core';



const LandingNav = () => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }) => !!user);
  const schema = useSelector(
    ({
      chrome: {
        navigation: { landingPage },
      },
    }) => landingPage
  );
  // const modules = useSelector((state) => state.chrome.modules);
  // useEffect(() => {
  //   if (showNav) {
  //     setElementReady(true);
  //   }
  // }, [showNav]);

  // useEffect(() => {
  //   axios.get(`${window.location.origin}${isBeta() ? '/beta' : ''}/config/chrome/landing-navigation.json`).then((response) => {
  //     dispatch(loadNavigationLandingPage(response.data));
  //   });
  // }, []);

  // /**
  //  * render navigation only if the user is logged in
  //  */
  // if (!showNav || !elementReady || !schema) {
  //   return <NavLoader />;
  // }

  const [activeItem, setActiveItem] = React.useState(0);
  const onSelect = result => setActiveItem(result.itemId);
  const onMenuSelect = (event, itemId) => setActiveItem(itemId);

  const numFlyouts = 2;
  const FlyoutMenu = ({ depth, children }) => (
    <Menu key={depth} containsFlyout isNavFlyout id={`menu-${depth}`} onSelect={onMenuSelect}>
      <MenuContent>
        <MenuList>
          <MenuItem className="favorite" flyoutMenu={children} itemId={`next-menu-${depth}`} to={`#menu-link-${depth}`}>
            Developer Sandbox
            <div className="pf-c-menu__item-description">
              description
            </div>
          </MenuItem>
          {[...Array(numFlyouts - depth).keys()].map(j => (
            <MenuItem key={`${depth}-${j}`} itemId={`${depth}-${j}`} to={`#menu-link-${depth}-${j}`}>
              Menu {depth} item {j}
              <div className="pf-c-menu__item-description">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </div>
            </MenuItem>
          ))}
          <MenuItem flyoutMenu={children} itemId={`next-menu-2-${depth}`} to={`#second-menu-link-${depth}`}>
            Red Hat Product Trials
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  let curFlyout = <FlyoutMenu depth={1} />;
  for (let i = 2; i < numFlyouts - 1; i++) {
    curFlyout = <FlyoutMenu depth={i}>{curFlyout}</FlyoutMenu>;
  }


  return (
    <Nav ouiaId="SideNavigation">
      <NavList>
        <NavGroup>
          <NavItem id="flyout-link1" to="#flyout-link1" itemId={0} isActive={activeItem === 0}>
            Home
          </NavItem>
          <NavItem id="flyout-link2" to="#flyout-link2" itemId={1} isActive={activeItem === 1}>
            Favorites
          </NavItem>
          <NavItem id="flyout-link3" to="#flyout-link3" itemId={2} isActive={activeItem === 2}>
            Learning Resources
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Try and Buy
          </NavItem>
        </NavGroup>

        <NavGroup title="All Services">
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Application Services
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
             AppStudio
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Business Services
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
             Data Services
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Identity and Access Management
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Integrations and Notifications
          </NavItem>
          <NavItem flyout={curFlyout} id="flyout-link4" to="#flyout-link4" itemId={3} isActive={activeItem === 3}>
            Monitoring
          </NavItem>
        </NavGroup>
      </NavList>
    </Nav>
  );
};

export default LandingNav;
