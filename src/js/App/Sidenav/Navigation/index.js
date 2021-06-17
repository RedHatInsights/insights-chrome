import React, { Fragment, useRef, useState } from 'react';
import { Nav, NavList } from '@patternfly/react-core';

import NavContext from './navContext';
import componentMapper from './componentMapper';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import BetaInfoModal from '../BetaInfoModal';
import { isBeta } from '../../../utils';

import './Navigation.scss';
import useNavigation from '../../../utils/useNavigation';
import NavLoader from './Loader';

const Navigation = () => {
  const { loaded, schema } = useNavigation();
  const [showBetaModal, setShowBetaModal] = useState();
  const deferedOnClickArgs = useRef([]);

  const onLinkClick = (origEvent, href) => {
    if (!showBetaModal && !isBeta()) {
      origEvent.preventDefault();
      deferedOnClickArgs.current = [origEvent, href];
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
      <Nav aria-label="Insights Global Navigation" data-ouia-safe="true">
        <NavList>
          <NavContext.Provider
            value={{
              componentMapper,
              onLinkClick,
            }}
          >
            {schema.navItems.map((item, index) => (
              <ChromeNavItemFactory key={index} {...item} />
            ))}
          </NavContext.Provider>
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
        menuItemClicked={deferedOnClickArgs.current[1]?.title}
      />
    </Fragment>
  );
};

export default Navigation;
