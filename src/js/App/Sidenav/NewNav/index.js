import React from 'react';
import PropTypes from 'prop-types';
import ChromeNavItemFactory from './ChromeNavItemFactory';
import NavContext from './navContext';
import componentMapper from './componentMapper';
import { Nav, NavList } from '@patternfly/react-core';

const Navigation = ({ schema, onClick }) => {
  const navItems = schema.navItems;
  return (
    <Nav aria-label="Insights Global Navigation" data-ouia-safe="true">
      <NavList>
        <NavContext.Provider
          value={{
            componentMapper,
            onClick,
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
  onClick: PropTypes.func.isRequired,
};

export default Navigation;
