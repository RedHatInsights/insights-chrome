import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import NavContext from './navContext';

const ChromeNavItemFactory = ({ groupId, expandable, ...rest }) => {
  const { componentMapper } = useContext(NavContext);
  let Component;
  if (groupId) {
    Component = componentMapper.group;
  } else if (expandable) {
    Component = componentMapper.expandable;
  } else {
    Component = componentMapper.item;
  }

  return <Component {...rest} />;
};

ChromeNavItemFactory.propTypes = {
  groupId: PropTypes.string,
  expandable: PropTypes.bool,
};

export default ChromeNavItemFactory;
