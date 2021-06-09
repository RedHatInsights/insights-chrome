import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { appNavClick } from '../../../redux/actions';

const LinkWrapper = ({ href, className, children }) => {
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
  const onClick = () => {
    dispatch(appNavClick({ id: actionId }, domEvent));
  };
  return (
    <NavLink onClick={onClick} to={href} className={className}>
      {children}
    </NavLink>
  );
};

LinkWrapper.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const basepath = document.baseURI;

const RefreshLink = ({ href, isExternal, ...props }) => <a href={isExternal ? href : `${basepath}${href.replace(/^\//, '')}`} {...props} />;

RefreshLink.propTypes = {
  href: PropTypes.string.isRequired,
  isExternal: PropTypes.bool,
};

const ChromeLink = ({ appId, children, ...rest }) => {
  const isModule = useSelector(({ chrome: { modules } }) => Object.prototype.hasOwnProperty.call(modules, appId));
  const LinkComponent = isModule ? LinkWrapper : 'a';
  return <LinkComponent {...rest}>{children}</LinkComponent>;
};

ChromeLink.propTypes = {
  appId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ChromeLink;
