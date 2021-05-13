import React from 'react';
import PropTypes from 'prop-types';
import { NavExpandable } from '@patternfly/react-core';
import NavigationItem from './NavigationItem';
import './SectionNav.scss';

const ExpandableNav = ({ subItems, onClick, title, id, active, ignoreCase, activeLocation, activeApp, navigate, isBeta, isHidden }) => {
  if (subItems?.length > 0) {
    return (
      isHidden
      ? null
      : <NavExpandable className="ins-m-navigation-align" title={title} id={id} itemID={id} ouiaId={id} isActive={active} isExpanded={active}>
        {subItems.map((subItem, subKey) => (
          <NavigationItem
            ignoreCase={subItem.ignoreCase}
            itemID={subItem.reload || subItem.id}
            ouiaId={subItem.reload || subItem.id}
            key={subKey}
            title={subItem.title}
            parent={subItem.reload ? activeLocation : `${activeLocation}${id ? `/${id}` : ''}`}
            isActive={active && subItem.id === activeApp}
            onClick={(event) => onClick(event, subItem)}
            navigate={subItem?.navigate}
            isBeta={subItem?.isBeta}
            isHidden={subItem?.isHidden}
          />
        ))}
      </NavExpandable>
    );
  }
  return (
    <NavigationItem
      ignoreCase={ignoreCase}
      itemID={id}
      ouiaId={id}
      title={title}
      parent={activeLocation}
      // TODO: Fix me! Please! This is ugly!
      isActive={!window.location.pathname.includes('openshift/cost-management/') && (active || id === activeApp)}
      onClick={onClick}
      navigate={navigate}
      isBeta={isBeta}
      isHidden={isHidden}
    />
  );
};

ExpandableNav.propTypes = {
  subItems: PropTypes.array,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  ignoreCase: PropTypes.bool,
  activeLocation: PropTypes.string.isRequired,
  activeApp: PropTypes.string,
  active: PropTypes.bool,
  navigate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isBeta: PropTypes.bool,
  isHidden: PropTypes.bool,
};

export default ExpandableNav;
