import { ScalprumComponent } from '@scalprum/react-core';
import React, { memo, useContext, useEffect, useState } from 'react';
import LoadingFallback from '../../utils/loading-fallback';
import ErrorComponent from '../ErrorComponents/DefaultErrorComponent';
import classNames from 'classnames';
import { HelpTopicContext } from '@patternfly/quickstarts';
import GatewayErrorComponent from '../ErrorComponents/GatewayErrorComponent';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { gatewayErrorAtom } from '../../state/atoms/gatewayErrorAtom';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { NavItemPermission } from '../../@types/types';
import { evaluateVisibility } from '../../utils/isNavItemVisible';
import NotFoundRoute from '../NotFoundRoute';
import { globalFilterHiddenAtom } from '../../state/atoms/globalFilterAtom';

export type ChromeRouteProps = {
  scope: string;
  module: string;
  path: string;
  exact?: boolean;
  scopeClass?: string;
  props?: any;
  permissions?: NavItemPermission[];
};

// eslint-disable-next-line react/display-name
const ChromeRoute = memo(
  ({ scope, module, scopeClass, path, props, permissions }: ChromeRouteProps) => {
    const isPreview = useAtomValue(isPreviewAtom);
    const setGlobalFilterHidden = useSetAtom(globalFilterHiddenAtom);
    const { setActiveHelpTopicByName } = useContext(HelpTopicContext);
    const gatewayError = useAtomValue(gatewayErrorAtom);
    const [isHidden, setIsHidden] = useState<boolean | null>(null);
    const currentActiveModule = useAtomValue(activeModuleAtom);
    const setActiveModule = useSetAtom(activeModuleAtom);

    async function checkPermissions(permissions: NavItemPermission[]) {
      try {
        const withResult = await Promise.all(permissions.map((permission) => evaluateVisibility({ permissions: permission })));
        setIsHidden(withResult.some((result) => result.isHidden));
      } catch (error) {
        console.error('Error while checking route permissions', error);
        // if there is an error, hide the route
        // better missing page than runtime error that brings down entire chrome
        setIsHidden(true);
      }
    }

    useEffect(() => {
      if (Array.isArray(permissions)) {
        checkPermissions(permissions);
      }
    }, [permissions]);

    useEffect(() => {
      // Only trigger update on first application render or when navigating to a different app
      // This prevents unnecessary updates while still allowing navigation between apps
      if (currentActiveModule !== scope) {
        setActiveModule(scope);
      }
      /**
       * TODO: Discuss default close feature of topics
       * Topics drawer has no close button, therefore there might be an issue with opened topics after user changes route and does not clear the active topic trough the now non existing elements.
       */
      setActiveHelpTopicByName?.('');

      // reset visibility function
      setIsHidden(null);
      return () => {
        /**
         * Reset global filter when switching application
         */
        setGlobalFilterHidden(false);
      };
    }, [scope]);

    if (gatewayError) {
      return <GatewayErrorComponent error={gatewayError} />;
    }

    if (isHidden === null && Array.isArray(permissions)) {
      return LoadingFallback;
    }

    if (isHidden) {
      // do not spill the beans about hidden routes
      return <NotFoundRoute />;
    }

    return (
      <div className={classNames(scopeClass, scope)}>
        <ScalprumComponent
          // TODO: fix in scalprum. The async loader is no triggered when module/scope changes. We had to abuse the key
          key={`${path}-${isPreview}`}
          ErrorComponent={<ErrorComponent />}
          fallback={LoadingFallback}
          // LoadingFallback={() => LoadingFallback}
          scope={scope}
          module={module}
          appId={scope}
          {...props}
        />
      </div>
    );
  },
  // prevent unnecessary re-render that can trigger initialization phase of a module
  (prevProps, nextProps) =>
    prevProps.scope === nextProps.scope &&
    prevProps.module === nextProps.module &&
    prevProps.scopeClass === nextProps.scopeClass &&
    prevProps.path === nextProps.path
);

export default ChromeRoute;
