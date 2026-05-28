import React, { useContext } from 'react';
import { UNSAFE_RouteContext as RouteContext } from 'react-router-dom';

/**
 * RouterContextGuard - Defensive wrapper to prevent React Router context race conditions
 *
 * Problem: In federated module architecture, child apps may attempt to use React Router
 * hooks before the context is fully initialized, causing errors like:
 * "Cannot destructure property 'future' of 'useContext(...)' as it is null"
 *
 * Solution: This component checks if the Router context exists and is initialized
 * before rendering children. If not ready, returns null (wait for context).
 *
 * Related: RHCLOUD-48022 - React Router context race condition
 */
const RouterContextGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const routeContext = useContext(RouteContext);

  // If context is null or doesn't have required properties, don't render yet
  if (!routeContext || !routeContext.matches) {
    return null;
  }

  return <>{children}</>;
};

export default RouterContextGuard;
