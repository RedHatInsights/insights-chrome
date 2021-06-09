import React from 'react';
import PropTypes from 'prop-types';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import NavContext from './navContext';
import componentMapper from './componentMapper';
import { Nav, NavList } from '@patternfly/react-core';

const Navigation = ({ schema }) => {
  const navItems = schema.navItems;
  return (
    <Nav aria-label="Insights Global Navigation" data-ouia-safe="true">
      <NavList>
        <NavContext.Provider
          value={{
            componentMapper,
          }}
        >
          {navItems.map((item, index) => (
            <ChromeNavItemFactory key={index} {...item} />
          ))}
        </NavContext.Provider>
      </NavList>
    </Nav>
  );
};

Navigation.propTypes = {
  schema: PropTypes.object.isRequired,
};

export default Navigation;
