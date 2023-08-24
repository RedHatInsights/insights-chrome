import React, { useEffect, useMemo } from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { NavItem } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import FlaskIcon from '@patternfly/react-icons/dist/dynamic/icons/flask-icon';
import BellIcon from '@patternfly/react-icons/dist/dynamic/icons/bell-icon';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import { titleCase } from 'title-case';
import classNames from 'classnames';
import get from 'lodash/get';

import { isBeta } from '../../utils/common';
import ChromeLink, { LinkWrapperProps } from '../ChromeLink/ChromeLink';
import { useDispatch, useSelector } from 'react-redux';
import useRenderFedramp from '../../utils/useRenderFedramp';
import { markActiveProduct } from '../../redux/actions';
import { ChromeNavItemProps } from '../../@types/types';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';

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
  const { favoritePages } = useFavoritePagesWrapper();
  const isFavorited = useMemo(() => favoritePages.find(({ favorite, pathname }) => favorite && pathname === href), [href, favoritePages]);

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
      className={classNames('chr-c-navigation__item', className, { 'chr-c-navigation__with-notifier': hasNotifier })}
      itemID={href}
      data-quickstart-id={href}
      preventDefault
      isActive={active}
      to={href}
      ouiaId={title}
      component={
        ((props: LinkWrapperProps) => (
          <ChromeLink {...props} isBeta={isBetaEnv} isExternal={isExternal} appId={appId} />
        )) as unknown as React.ReactNode
      }
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
      {isFavorited && (
        <Icon>
          <StarIcon color="var(--pf-v5-global--palette--gold-400)" />
        </Icon>
      )}
      {hasNotifier && (
        <Icon size="md">
          <BellIcon className="notifier-icon" color="var(--pf-v5-global--default-color--200)" />
        </Icon>
      )}
    </NavItem>
  );
};

export default ChromeNavItem;
