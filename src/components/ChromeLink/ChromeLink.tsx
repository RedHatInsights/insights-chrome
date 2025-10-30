import React, { memo, useContext, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { preloadModule } from '@scalprum/core';

import NavContext, { OnLinkClick } from '../Navigation/navContext';
import { NavDOMEvent } from '../../@types/types';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { triggerNavListenersAtom } from '../../state/atoms/activeAppAtom';

interface RefreshLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  isExternal?: boolean;
  onLinkClick?: OnLinkClick;
  isBeta?: boolean;
  href: string;
  active?: boolean;
  onClick?: () => void;
  appId?: string;
  currAppId?: string;
  target?: string;
  rel?: string;
}

export interface LinkWrapperProps extends RefreshLinkProps {
  className?: string;
  tabIndex?: number;
}

const LinkWrapper: React.FC<LinkWrapperProps> = memo(
  ({ href = '', isBeta, onLinkClick, className, currAppId, appId, children, tabIndex, isExternal, ...props }) => {
    const linkRef = useRef<HTMLAnchorElement | null>(null);
    const moduleRoutes = useAtomValue(moduleRoutesAtom);
    const triggerNavListener = useSetAtom(triggerNavListenersAtom);
    const moduleEntry = useMemo(() => moduleRoutes?.find((route) => href?.includes(route.path)), [href, appId]);
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
      triggerNavListener({ navId: actionId, domEvent });
    };

    // turns /settings/rbac/roles -> settings_rbac_roles
    const quickStartHighlightId = href
      .split('/')
      .slice(href.startsWith('/') ? 1 : 0)
      .join('_');
    return (
      <NavLink
        {...props}
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
  }
);

LinkWrapper.displayName = 'MemoizedLinkWrapper';

const basepath = document.baseURI;

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
  const currAppId = useAtomValue(activeModuleAtom);

  const LinkComponent = !rest.isExternal ? LinkWrapper : RefreshLink;
  return (
    <LinkComponent {...(inPageLayout && !isNavOpen ? { tabIndex: -1 } : {})} onLinkClick={onLinkClick} appId={appId} currAppId={currAppId} {...rest}>
      {children}
    </LinkComponent>
  );
};

export default ChromeLink;
