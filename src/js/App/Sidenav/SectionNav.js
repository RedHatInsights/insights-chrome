import React from 'react';
import PropTypes from 'prop-types';
import { NavGroup } from '@patternfly/react-core/dist/js/components/Nav/NavGroup';
import ExpandableNav from './ExpandableNav';
import './SectionNav.scss';

const SectionNav = ({ items, title, id, onClick, ...props }) => {
  if (items?.length > 0) {
    return (
      <NavGroup className="ins-c-section-nav" id={id} title={title.toUpperCase()}>
        {items.map((item, key) => (
          <ExpandableNav
            key={item.id || key}
            {...props}
            {...item}
            onClick={(event, subItem) => (item.subItems ? onClick(event, subItem, item) : onClick(event, item))}
          />
        ))}
      </NavGroup>
    );
  }
  const item = { id, title, ...props };
  return (
    <ExpandableNav
      title={title}
      id={id}
      onClick={(event, subItem) => (item.subItems ? onClick(event, subItem, item) : onClick(event, item))}
      {...props}
    />
  );
};

SectionNav.propTypes = {
  items: PropTypes.array,
  subItems: PropTypes.array,
  title: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  activeLocation: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SectionNav;
