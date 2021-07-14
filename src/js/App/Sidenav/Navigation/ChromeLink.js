import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { appNavClick } from '../../../redux/actions';
import NavContext from './navContext';

const useDynamicModule = (appId) => {
  const [isDynamic, setIsDynamic] = useState();
  const { modules, activeModule } = useSelector(({ chrome: { modules, activeModule } }) => ({
    modules,
    activeModule,
  }));
  useEffect(() => {
    const currentModule = modules[appId];
    if (!currentModule) {
      setIsDynamic(false);
    } else if (appId === activeModule) {
      setIsDynamic(true);
    } else if (currentModule && appId !== activeModule) {
      setIsDynamic(currentModule.dynamic !== false && modules[activeModule]?.dynamic !== false);
    }
  }, [appId]);

  return isDynamic;
};

const LinkWrapper = ({ href, isBeta, onLinkClick, className, currAppId, appId, children }) => {
  let actionId = href.split('/').slice(2).join('/');
  if (actionId.includes('/')) {
    actionId = actionId.split('/').pop();
  }
  if (currAppId !== appId && href.split('/').length === 3) {
    actionId = '/';
  }

  /**
   * If the sub nav item points to application root
   * eg. /openshift/cost-management we don't want to send "/cost-management" but "/"
   * We are not in app sub route but in app root
   */
  const domEvent = {
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
  const onClick = (event) => {
    if (onLinkClick && isBeta) {
      if (!onLinkClick(event, href)) {
        return false;
      }
    }

    dispatch(appNavClick({ id: actionId }, domEvent));
  };
  return (
    <NavLink data-testid="router-link" onClick={onClick} to={href} className={className}>
      {children}
    </NavLink>
  );
};

LinkWrapper.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  isBeta: PropTypes.bool,
  onLinkClick: PropTypes.func.isRequired,
  currAppId: PropTypes.string,
  appId: PropTypes.string.isRequired,
};

const basepath = document.baseURI;

const cleanRefreshLinkProps = ({ active, onClick, appId, currAppId, ...rest }) => rest;

const RefreshLink = (props) => {
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

RefreshLink.propTypes = {
  href: PropTypes.string.isRequired,
  isExternal: PropTypes.bool,
  onLinkClick: PropTypes.func,
  isBeta: PropTypes.bool,
};

const ChromeLink = ({ appId, children, ...rest }) => {
  const { onLinkClick } = useContext(NavContext);
  const currAppId = useSelector(({ chrome }) => chrome?.appId);
  const isDynamic = useDynamicModule(appId);

  if (!rest.isExternal && typeof isDynamic === 'undefined') {
    return null;
  }

  const LinkComponent = !rest.isExternal && isDynamic ? LinkWrapper : RefreshLink;
  return (
    <LinkComponent onLinkClick={onLinkClick} appId={appId} currAppId={currAppId} {...rest}>
      {children}
    </LinkComponent>
  );
};

ChromeLink.propTypes = {
  appId: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default ChromeLink;
