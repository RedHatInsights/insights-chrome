import React from 'react';
import PropTypes from 'prop-types';
import { NavGroup } from '@patternfly/react-core/dist/js/components/Nav/NavGroup';
import ExpandableNav from './ExpandableNav';
import './SectionNav.scss';

const anisbleHackIds = ['automation-calculator', 'organization-statistics', 'job-explorer', 'clusters', 'notifications'];

const sectionTitleMapper = (id) =>
  ({ operations: 'Operations Insights', security: 'Security Insights', business: 'Business Insights', insights: 'Insights' }[id] || '');

const SectionNav = ({ items, section, onClick, ...props }) => {
  if (items?.length > 0) {
    return (
      <NavGroup className="ins-c-section-nav" id={section} title={sectionTitleMapper(section)}>
        {items.map((item, key) => (
          <ExpandableNav
            key={item.id || key}
            {...props}
            {...item}
            onClick={(event, subItem) => {
              // TODO: Fix me! It adds parent that have been removed in Navigation.js:209
              if (anisbleHackIds.includes(item.id)) {
                return onClick(event, item, { id: 'insights' });
              }
              return item.subItems ? onClick(event, subItem, item) : onClick(event, item);
            }}
          />
        ))}
      </NavGroup>
    );
  }
  return (
    <ExpandableNav
      title={props.title}
      id={props.id}
      onClick={(event, subItem) => (props.subItems ? onClick(event, subItem, props) : onClick(event, props))}
      {...props}
    />
  );
};

SectionNav.propTypes = {
  items: PropTypes.array,
  subItems: PropTypes.array,
  section: (props, propName, component) => {
    if (!props[propName] && Object.prototype.hasOwnProperty.call(props, 'items')) {
      return new Error(
        `Prop "${propName}" is required if object has "items" prop. Invalid prop ${propName} supplied to ${component}. Validation failed.`
      );
    }
    if (props[propName] && typeof props[propName] !== 'string') {
      return new Error(
        `Failed prop type. Invalid prop ${propName} supplied to ${component}. Expected "string", got "${typeof props[propName]}". Validation failed.`
      );
    }
  },
  id: PropTypes.string,
  title: PropTypes.string,
  activeLocation: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SectionNav;
