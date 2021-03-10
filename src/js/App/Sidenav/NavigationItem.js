import React from 'react';
import { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import PropTypes from 'prop-types';
import { titleCase } from 'title-case';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';

const basepath = document.baseURI;

const NavigationItem = ({ itemID, title, parent, navigate, ignoreCase, className, ...props }) => (
  <NavItem {...props} itemId={itemID} className={className} preventDefault to={navigate || `${basepath}${parent}/${itemID}`}>
    {typeof title === 'string' && !ignoreCase ? titleCase(title) : title} {navigate && <ExternalLinkAltIcon />}
  </NavItem>
);

NavigationItem.propTypes = {
  itemID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.node,
  navigate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  parent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ignoreCase: PropTypes.bool,
  className: PropTypes.string,
};

NavigationItem.defaultProps = {
  parent: '',
};

export default NavigationItem;
