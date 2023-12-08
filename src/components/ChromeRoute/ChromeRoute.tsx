import { ScalprumComponent } from '@scalprum/react-core';
import React, { memo, useContext, useEffect } from 'react';
import LoadingFallback from '../../utils/loading-fallback';
import { batch, useDispatch, useSelector } from 'react-redux';
import { toggleGlobalFilter, updateDocumentTitle } from '../../redux/actions';
import ErrorComponent from '../ErrorComponents/DefaultErrorComponent';
import { getPendoConf } from '../../analytics';
import classNames from 'classnames';
import { HelpTopicContext } from '@patternfly/quickstarts';
import GatewayErrorComponent from '../ErrorComponents/GatewayErrorComponent';
import { ReduxState } from '../../redux/store';
import { DeepRequired } from 'utility-types';
import { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtom } from 'jotai';
import { activeModuleAtom } from '../../state/atoms';

export type ChromeRouteProps = {
  scope: string;
  module: string;
  path: string;
  exact?: boolean;
  scopeClass?: string;
  props?: any;
};

// eslint-disable-next-line react/display-name
const ChromeRoute = memo(
  ({ scope, module, scopeClass, path, props }: ChromeRouteProps) => {
    const dispatch = useDispatch();
    const { setActiveHelpTopicByName } = useContext(HelpTopicContext);
    const { user } = useContext(ChromeAuthContext);
    const gatewayError = useSelector(({ chrome: { gatewayError } }: ReduxState) => gatewayError);
    const defaultTitle = useSelector(({ chrome: { modules } }: ReduxState) => modules?.[scope]?.defaultDocumentTitle || scope);

    const [activeModule, setActiveModule] = useAtom(activeModuleAtom);

    useEffect(() => {
      batch(() => {
        // Only trigger update on a first application render before any active module has been selected
        // should be triggered only once per session
        if (!activeModule) {
          /**
           * Default document title update. If application won't update its title chrome sets a title using module config
           */
          dispatch(updateDocumentTitle(defaultTitle || 'Hybrid Cloud Console'));
        }
        setActiveModule(scope);
      });
      /**
       * update pendo metadata on application change
       */
      if (window.pendo) {
        try {
          window.pendo.updateOptions(getPendoConf(user as DeepRequired<ChromeUser>));
        } catch (error) {
          console.error('Unable to update pendo options');
          console.error(error);
        }
      }

      /**
       * TODO: Discuss default close feature of topics
       * Topics drawer has no close button, therefore there might be an issue with opened topics after user changes route and does not clear the active topic trough the now non existing elements.
       */
      setActiveHelpTopicByName && setActiveHelpTopicByName('');

      return () => {
        /**
         * Reset global filter when switching application
         */
        dispatch(toggleGlobalFilter(false));
      };
    }, [scope]);

    if (gatewayError) {
      return <GatewayErrorComponent error={gatewayError} />;
    }
    return (
      <div className={classNames(scopeClass, scope)}>
        <ScalprumComponent
          // TODO: fix in scalprum. The async loader is no triggered when module/scope changes. We had to abuse the key
          key={path}
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
