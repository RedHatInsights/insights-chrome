import React from 'react';
import { NavItem } from '@patternfly/react-core';
import PropTypes from 'prop-types';
import { titleCase } from 'title-case';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { betaBadge } from '../Header/Tools.js';
import classnames from 'classnames';
import './Navigation.scss';

const basepath = document.baseURI;
const NavigationItem = ({ itemID, title, parent, navigate, ignoreCase, className, isBeta, isLoading, isHidden, ...props }) =>
  isHidden ? null : (
    <NavItem
      {...props}
      itemId={itemID}
      className={classnames(className, { 'ins-c-navigation__additional-links': !isLoading && navigate })}
      preventDefault
      to={navigate || `${basepath}${parent}/${itemID}`}
    >
      {typeof title === 'string' && !ignoreCase ? titleCase(title) : title} {!isLoading && navigate && <ExternalLinkAltIcon />}
      {!isLoading && isBeta && !window.insights.chrome.isBeta() && !navigate && betaBadge('ins-c-navigation__beta-badge')}
    </NavItem>
  );

NavigationItem.propTypes = {
  itemID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.node,
  navigate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  parent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ignoreCase: PropTypes.bool,
  className: PropTypes.string,
  isBeta: PropTypes.bool,
  isLoading: PropTypes.bool,
  isHidden: PropTypes.bool,
};

NavigationItem.defaultProps = {
  parent: '',
  isLoading: false,
};

export default NavigationItem;
