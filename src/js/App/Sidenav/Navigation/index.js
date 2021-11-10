import React, { Fragment, useRef, useState } from 'react';
import { Nav, NavList, PageContextConsumer } from '@patternfly/react-core';

import NavContext from './navContext';
import componentMapper from './componentMapper';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import BetaInfoModal from '../BetaInfoModal';
import { getUrl, isBeta } from '../../../utils';

import useNavigation from '../../../utils/useNavigation';
import NavLoader from './Loader';
import ChromeNavItem from './ChromeNavItem';

const Navigation = () => {
  const { loaded, schema } = useNavigation();
  const [showBetaModal, setShowBetaModal] = useState();
  const deferedOnClickArgs = useRef([]);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

  const onLinkClick = (origEvent, href) => {
    if (!showBetaModal && !isBeta()) {
      origEvent.preventDefault();
      deferedOnClickArgs.current = [origEvent, href, origEvent?.target?.text];
      setShowBetaModal(true);
      return false;
    }

    return true;
  };

  if (!loaded) {
    return <NavLoader />;
  }

  return (
    <Fragment>
      <div className="ins-c-app-title">{schema.title}</div>
      <Nav aria-label="Insights Global Navigation" data-ouia-safe="true" ouiaId="SideNavigation">
        <NavList>
          <PageContextConsumer>
            {({ isNavOpen }) => (
              <NavContext.Provider
                value={{
                  componentMapper,
                  onLinkClick,
                  inPageLayout: true,
                  isNavOpen,
                }}
              >
                {schema.navItems.map((item, index) => (
                  <ChromeNavItemFactory key={index} {...item} />
                ))}
                {showBundleCatalog ? <ChromeNavItem title="Quickstarts" href={`/${getUrl('bundle')}/quickstarts`} appId="dynamic" /> : <Fragment />}
              </NavContext.Provider>
            )}
          </PageContextConsumer>
        </NavList>
      </Nav>
      <BetaInfoModal
        isOpen={showBetaModal}
        onClick={(event) => {
          if (!isBeta()) {
            const [origEvent, href] = deferedOnClickArgs.current;
            const isMetaKey = event.ctrlKey || event.metaKey || event.which === 2 || origEvent.ctrlKey || origEvent.metaKey || origEvent.which === 2;
            const url = `${document.baseURI}beta${href}`;
            isMetaKey ? window.open(url) : (window.location.href = url);
          }
        }}
        onCancel={() => setShowBetaModal(false)}
        menuItemClicked={deferedOnClickArgs.current[2]}
      />
    </Fragment>
  );
};

export default Navigation;
