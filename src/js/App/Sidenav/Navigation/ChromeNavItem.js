import React from 'react';
import PropTypes from 'prop-types';
import { NavItem } from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { titleCase } from 'title-case';
import classNames from 'classnames';

import { isBeta } from '../../../utils';
import { betaBadge } from '../../Header/Tools';
import ChromeLink from './ChromeLink';

const ChromeNavItem = ({ appId, className, href, isHidden, ignoreCase, title, isExternal, isBeta: isBetaEnv, active }) => {
  if (isHidden) {
    return null;
  }

  return (
    <NavItem
      className={classNames(className, { 'ins-c-navigation__additional-links': isExternal })}
      itemID={href}
      data-quickstart-id={href}
      preventDefault
      isActive={active}
      to={href}
      component={(props) => <ChromeLink {...props} isBeta={isBetaEnv} isExternal={isExternal} appId={appId} />}
    >
      {typeof title === 'string' && !ignoreCase ? titleCase(title) : title} {isExternal && <ExternalLinkAltIcon />}
      {isBetaEnv && !isBeta() && !isExternal && betaBadge('ins-c-navigation__beta-badge')}
    </NavItem>
  );
};

ChromeNavItem.propTypes = {
  isHidden: PropTypes.bool,
  ignoreCase: PropTypes.bool,
  title: PropTypes.node,
  isExternal: PropTypes.bool,
  isBeta: PropTypes.bool,
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  active: PropTypes.bool,
  appId: PropTypes.string,
};

export default ChromeNavItem;
