/* eslint-disable @typescript-eslint/no-var-requires */
import { getSharedScope, initSharedScope } from '@scalprum/core';
import { LinkProps, NavLinkProps, NavigateOptions, NavigateProps, To } from 'react-router-dom';

const updateSharedScope = () => {
  const calculateTo = (to: To) => {
    if (window.location.pathname.includes('/hac')) {
      // FIXME: Create a global dynamic plugin solution to scope plugin nested routes
      if (typeof to === 'string' && !to.startsWith('/hac') && to.startsWith('/')) {
        return `/hac${to}`;
      } else if (typeof to !== 'string' && to.pathname && !to.pathname.startsWith('/hac')) {
        return {
          ...to,
          pathname: `/hac${to.pathname}`,
        };
      }
      return to;
    }
    return to;
  };

  const modules = {
    'react-router-dom': async () => () => {
      // We have to hack our way around react-router-dom
      // Since we are no longer using basename we have to include `/hac` prefix
      const reactRouter = require('react-router-dom');
      return {
        ...reactRouter,
        useNavigate: () => {
          const oldNavigate = reactRouter.useNavigate();
          return (to: To, options?: NavigateOptions) => {
            oldNavigate(calculateTo(to), options);
          };
        },
        Link: (props: LinkProps) => {
          const Cmp = reactRouter.Link;
          const react = require('react');
          return react.createElement(Cmp, { ...props, to: calculateTo(props.to) });
        },
        Navigate: (props: NavigateProps) => {
          const react = require('react');
          const Cmp = reactRouter.Navigate;
          return react.createElement(Cmp, { ...props, to: calculateTo(props.to) });
        },
        NavLink: (props: NavLinkProps) => {
          const react = require('react');
          const Cmp = reactRouter.NavLink;
          return react.createElement(Cmp, { ...props, to: calculateTo(props.to) });
        },
      };
    },
  };

  // CRITICAL: initialize default scope and make it accessible for child modules
  initSharedScope();
  const scope = getSharedScope();

  // append module overrides to current webpack scope
  Object.keys(modules).forEach((moduleRequest) => {
    scope[moduleRequest] = {
      // The '*' semver range means "this shared module matches all requested versions",
      // i.e. make sure the plugin always uses the Console-provided shared module version
      '*': {
        get: modules[moduleRequest as keyof typeof modules],
        // Indicates that Console has already loaded the shared module
        loaded: 1,
      },
    };
  });
};

export default updateSharedScope;
