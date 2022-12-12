import React, { Fragment, useRef, useState } from 'react';
import { Nav, NavList, PageContextConsumer } from '@patternfly/react-core';

import NavContext from './navContext';
import componentMapper from './componentMapper';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import BetaInfoModal from '../../components/BetaInfoModal';
import { getUrl, isBeta } from '../../utils/common';

import NavLoader from './Loader';
import ChromeNavItem from './ChromeNavItem';
import type { Navigation as NavigationSchema } from '../../@types/types';

export type NavigationProps = { loaded: boolean; schema: NavigationSchema };

const Navigation: React.FC<NavigationProps> = ({ loaded, schema }) => {
  const [showBetaModal, setShowBetaModal] = useState(false);
  const deferedOnClickArgs = useRef<[React.MouseEvent<HTMLAnchorElement, MouseEvent> | undefined, string | undefined, string | undefined]>([
    undefined,
    undefined,
    undefined,
  ]);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

  const onLinkClick = (origEvent: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (!showBetaModal && !isBeta()) {
      origEvent.preventDefault();
      deferedOnClickArgs.current = [origEvent, href, origEvent?.currentTarget?.text];
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
      <div className="chr-c-app-title">{schema?.title}</div>
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
            const isMetaKey = event.ctrlKey || event.metaKey || origEvent?.ctrlKey || origEvent?.metaKey;
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
