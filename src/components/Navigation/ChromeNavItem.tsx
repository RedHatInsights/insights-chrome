import React, { useEffect } from 'react';
import { Icon, NavItem, Tooltip } from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import FlaskIcon from '@patternfly/react-icons/dist/js/icons/flask-icon';
import BellIcon from '@patternfly/react-icons/dist/js/icons/bell-icon';
import { titleCase } from 'title-case';
import classNames from 'classnames';
import get from 'lodash/get';

import { isBeta } from '../../utils/common';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { useDispatch, useSelector } from 'react-redux';
import useRenderFedramp from '../../utils/useRenderFedramp';
import { markActiveProduct } from '../../redux/actions';
import { ChromeNavItemProps } from '../../@types/types';

const ChromeNavItem = ({
  appId,
  className,
  href,
  isHidden,
  ignoreCase,
  title,
  isExternal,
  isBeta: isBetaEnv,
  active,
  product,
  notifier = '',
}: ChromeNavItemProps) => {
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
      className={classNames(className, { 'chr-c-navigation__with-notifier': hasNotifier })}
      itemID={href}
      data-quickstart-id={href}
      preventDefault
      isActive={active}
      to={href}
      ouiaId={title}
      component={(props: LinkWrapperProps) => (
        <ChromeLink {...props} documentTitleUpdate={title} isBeta={isBetaEnv} isExternal={isExternal} appId={appId} />
      )}
    >
      {typeof title === 'string' && !ignoreCase ? titleCase(title) : title}{' '}
      {isExternal && (
        <Icon isInline>
          <ExternalLinkAltIcon />
        </Icon>
      )}
      {isBetaEnv && !isBeta() && !isExternal && (
        <Tooltip position={'right'} content={<div>This service is a Preview.</div>}>
          <Icon className="chr-c-navigation__beta-icon" isInline>
            <FlaskIcon />
          </Icon>
        </Tooltip>
      )}
      {hasNotifier && <BellIcon size="md" className="notifier-icon" color="var(--pf-global--default-color--200)" />}
    </NavItem>
  );
};

export default ChromeNavItem;
