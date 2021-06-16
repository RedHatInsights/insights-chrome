import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { appNavClick } from '../../../redux/actions';
import NavContext from './navContext';

const useDynamicModule = () => {
  const [isDynamic, setIsDynamic] = useState();
  const { modules, activeModule } = useSelector(({ chrome: { modules, activeModule } }) => ({
    modules,
    activeModule,
  }));
  useEffect(() => {
    const currentModule = modules[activeModule];
    if (currentModule) {
      setIsDynamic(currentModule.dynamic !== false);
    }
  }, [activeModule]);

  return { isDynamic, activeModule };
};

const LinkWrapper = ({ href, isBeta, onLinkClick, className, children }) => {
  let actionId = href.split('/').slice(2).join('/');
  if (actionId.includes('/')) {
    actionId = actionId.split('/').pop();
  }
  const domEvent = {
    href,
    id: actionId,
    navId: actionId,
  };
  const dispatch = useDispatch();
  const onClick = (event) => {
    if (isBeta) {
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
};

const basepath = document.baseURI;

const RefreshLink = ({
  href,
  isExternal,
  onLinkClick,
  onClick /** on click must be separated because PF adds prevent default. We want that only for SPA links */,
  appId,
  isBeta,
  ...props
}) => (
  <a
    data-testid="native-link"
    href={isExternal ? href : `${basepath}${href.replace(/^\//, '')}`}
    onClick={(event) => {
      if (isBeta && !isExternal) {
        if (!onLinkClick(event, href)) {
          return false;
        }
      }
    }}
    {...props}
  />
);

RefreshLink.propTypes = {
  href: PropTypes.string.isRequired,
  isExternal: PropTypes.bool,
  appId: PropTypes.string,
  onClick: PropTypes.any,
  onLinkClick: PropTypes.func.isRequired,
  isBeta: PropTypes.bool,
};

const ChromeLink = ({ appId, children, ...rest }) => {
  const { onLinkClick } = useContext(NavContext);
  const { isDynamic, activeModule } = useDynamicModule();
  if (typeof isDynamic === 'undefined') {
    return null;
  }

  const LinkComponent = isDynamic || appId === activeModule ? LinkWrapper : RefreshLink;
  return (
    <LinkComponent onLinkClick={onLinkClick} appId={appId} {...rest}>
      {children}
    </LinkComponent>
  );
};

ChromeLink.propTypes = {
  appId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ChromeLink;
