import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { preloadModule } from '@scalprum/core';

import { appNavClick } from '../../../../redux/actions';
import NavContext, { OnLinkClick } from './navContext';
import { AnyObject } from '../../../types';
import { ReduxState, RouteDefinition } from '../../../../redux/store';

export type NavDOMEvent = {
  href: string;
  id: string;
  navId: string;
  type: string;
  target?: HTMLAnchorElement | null;
};

interface RefreshLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  isExternal?: boolean;
  onLinkClick?: OnLinkClick;
  isBeta?: boolean;
  href: string;
  active?: boolean;
  onClick?: () => void;
  appId: string;
  currAppId?: string;
}

interface LinkWrapperProps extends RefreshLinkProps {
  className?: string;
  tabIndex?: number;
}

const useDynamicModule = (appId: string) => {
  const [isDynamic, setIsDynamic] = useState<boolean | undefined>();
  const { modules, activeModule } = useSelector(({ chrome: { modules = {}, activeModule } }: AnyObject) => ({
    modules,
    activeModule,
  }));
  useEffect(() => {
    const currentModule = modules[appId];
    if (appId === 'dynamic') {
      setIsDynamic(true);
    } else if (!currentModule) {
      setIsDynamic(false);
    } else if (appId === activeModule) {
      setIsDynamic(true);
    } else if (currentModule && appId !== activeModule) {
      setIsDynamic(currentModule.dynamic !== false && modules[activeModule]?.dynamic !== false);
    }
  }, [appId]);

  return isDynamic;
};

const LinkWrapper: React.FC<LinkWrapperProps> = ({ href, isBeta, onLinkClick, className, currAppId, appId, children, tabIndex }) => {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const moduleRoutes = useSelector<ReduxState, RouteDefinition[]>(({ chrome: { moduleRoutes } }) => moduleRoutes);
  const moduleEntry = useMemo(() => moduleRoutes.find((route) => href.includes(route.path)), [href, appId]);
  const preloadTimeout = useRef<NodeJS.Timeout>();
  let actionId = href.split('/').slice(2).join('/');
  if (actionId.includes('/')) {
    actionId = actionId.split('/').pop() as string;
  }
  if (currAppId !== appId && href.split('/').length === 3) {
    actionId = '/';
  }

  /**
   * If the sub nav item points to application root
   * eg. /openshift/cost-management we don't want to send "/cost-management" but "/"
   * We are not in app sub route but in app root
   */
  const domEvent: NavDOMEvent = {
    href,
    id: actionId,
    navId: actionId,
    /**
     * @deprecated
     * Remove once nav overhaul is in all environments
     */
    type: 'click',
  };
  const dispatch = useDispatch();
  const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (event.ctrlKey || event.shiftKey) {
      return false;
    }
    if (onLinkClick && isBeta) {
      if (!onLinkClick(event, href)) {
        return false;
      }
    }

    /**
     * Add reference to the DOM link element
     */
    domEvent.target = linkRef.current;
    dispatch(appNavClick({ id: actionId }, domEvent));
  };

  // turns /settings/rbac/roles -> settings_rbac_roles
  const quickStartHighlightId = href
    .split('/')
    .slice(href.startsWith('/') ? 1 : 0)
    .join('_');
  return (
    <NavLink
      onMouseEnter={() => {
        if (moduleEntry) {
          preloadTimeout.current = setTimeout(() => {
            preloadModule(moduleEntry?.scope, moduleEntry?.module);
          }, 250);
        }
      }}
      onMouseLeave={() => {
        if (preloadTimeout.current) {
          clearTimeout(preloadTimeout.current);
        }
      }}
      tabIndex={tabIndex}
      ref={linkRef}
      data-testid="router-link"
      onClick={onClick}
      to={href}
      className={className}
      data-quickstart-id={quickStartHighlightId}
    >
      {children}
    </NavLink>
  );
};

const basepath = document.baseURI;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cleanRefreshLinkProps = ({ active, onClick, appId, currAppId, ...rest }: RefreshLinkProps) => rest;

const RefreshLink: React.FC<RefreshLinkProps> = (props) => {
  const { href, isExternal, onLinkClick, isBeta, ...rest } = cleanRefreshLinkProps(props);
  return (
    <a
      data-testid="native-link"
      href={isExternal ? href : `${basepath}${href.replace(/^\//, '')}`}
      {...(isExternal
        ? {
            rel: 'noreferrer noopener',
            target: '_blank',
          }
        : {})}
      onClick={(event) => {
        if (onLinkClick && isBeta && !isExternal) {
          if (!onLinkClick(event, href)) {
            return false;
          }
        }
      }}
      {...rest}
    />
  );
};

const ChromeLink: React.FC<LinkWrapperProps> = ({ appId, children, ...rest }) => {
  const { onLinkClick, isNavOpen, inPageLayout } = useContext(NavContext);
  const currAppId = useSelector(({ chrome }: AnyObject) => chrome?.appId);
  const isDynamic = useDynamicModule(appId);

  if (!rest.isExternal && typeof isDynamic === 'undefined') {
    return null;
  }

  const LinkComponent = !rest.isExternal && isDynamic ? LinkWrapper : RefreshLink;
  return (
    <LinkComponent {...(inPageLayout && !isNavOpen ? { tabIndex: -1 } : {})} onLinkClick={onLinkClick} appId={appId} currAppId={currAppId} {...rest}>
      {children}
    </LinkComponent>
  );
};

export default ChromeLink;
