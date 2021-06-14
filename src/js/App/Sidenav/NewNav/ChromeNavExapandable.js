import React from 'react';
import PropTypes from 'prop-types';
import { NavExpandable } from '@patternfly/react-core';
import ChromeNavItemFactory from './ChromeNavItemFactory';

const ChromeNavExapandable = ({ title, routes, active, isHidden }) => {
  if (isHidden) {
    return null;
  }

  return (
    <NavExpandable isExpanded={active} isActive={active} className="ins-m-navigation-align" title={title}>
      {routes.map((item, index) => (
        <ChromeNavItemFactory key={index} {...item} />
      ))}
    </NavExpandable>
  );
};

ChromeNavExapandable.propTypes = {
  isHidden: PropTypes.bool,
  title: PropTypes.string,
  routes: PropTypes.array.isRequired,
  active: PropTypes.bool,
};

export default ChromeNavExapandable;
