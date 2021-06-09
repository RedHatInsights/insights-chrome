import React from 'react';
import PropTypes from 'prop-types';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';

const ChromeNavExapandable = ({ title, routes, active }) => {
  return (
    <NavExpandable isExpanded={active} isActive={active} className="ins-m-navigation-align" title={title}>
      {routes.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

ChromeNavExapandable.propTypes = {
  title: PropTypes.string,
  routes: PropTypes.array.isRequired,
  active: PropTypes.bool,
};

export default ChromeNavExapandable;
