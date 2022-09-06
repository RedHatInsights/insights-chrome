import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavItem } from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import BellIcon from '@patternfly/react-icons/dist/js/icons/bell-icon';
import { titleCase } from 'title-case';
import classNames from 'classnames';
import get from 'lodash/get';

import { isBeta } from '../../../utils';
import { betaBadge } from '../../Header/Tools';
import ChromeLink from './ChromeLink';
import { useDispatch, useSelector } from 'react-redux';
import useRenderFedramp from '../../../utils/useRenderFedramp';
import { markActiveProduct } from '../../../redux/actions';

const ChromeNavItem = ({ appId, className, href, isHidden, ignoreCase, title, isExternal, isBeta: isBetaEnv, active, product, notifier = '' }) => {
  const hasNotifier = useSelector((state) => get(state, notifier));
  const renderFedramp = useRenderFedramp(appId, href);
  const dispatch = useDispatch();
  useEffect(() => {
    if (active) {
      dispatch(markActiveProduct(product));
    }
  }, [active]);
  if (renderFedramp !== true) {
    return null;
  }

  if (isHidden) {
    return null;
  }

  return (
    <NavItem
      className={classNames(className, { 'chr-c-navigation__additional-links': isExternal, 'chr-c-navigation__with-notifier': hasNotifier })}
      itemID={href}
      data-quickstart-id={href}
      preventDefault
      isActive={active}
      to={href}
      ouiaId={title}
      component={(props) => <ChromeLink {...props} isBeta={isBetaEnv} isExternal={isExternal} appId={appId} />}
    >
      {typeof title === 'string' && !ignoreCase ? titleCase(title) : title} {isExternal && <ExternalLinkAltIcon />}
      {isBetaEnv && !isBeta() && !isExternal && betaBadge('chr-c-navigation__beta-badge')}
      {hasNotifier && <BellIcon size="md" className="notifier-icon" color="var(--pf-global--default-color--200)" />}
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
  notifier: PropTypes.string,
  product: PropTypes.string,
};

export default ChromeNavItem;
