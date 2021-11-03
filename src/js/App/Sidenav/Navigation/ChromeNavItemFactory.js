import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import NavContext from './navContext';

const ChromeNavItemFactory = ({ groupId, expandable, dynamicNav, ...rest }) => {
  const { componentMapper } = useContext(NavContext);
  let Component;
  if (groupId) {
    Component = componentMapper.group;
  } else if (expandable) {
    Component = componentMapper.expandable;
  } else if (dynamicNav) {
    Component = componentMapper.dynamicNav;
  } else {
    Component = componentMapper.item;
  }

  return <Component {...rest} dynamicNav={dynamicNav} />;
};

ChromeNavItemFactory.propTypes = {
  groupId: PropTypes.string,
  expandable: PropTypes.bool,
  dynamicNav: PropTypes.string,
};

export default ChromeNavItemFactory;
