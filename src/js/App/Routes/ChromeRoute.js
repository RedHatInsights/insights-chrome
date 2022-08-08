import { ScalprumComponent } from '@scalprum/react-core';
import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';
import { batch, useDispatch, useSelector } from 'react-redux';
import { changeActiveModule, toggleGlobalFilter, updateDocumentTitle } from '../../redux/actions';
import ErrorComponent from '../ErrorComponent/ErrorComponent';
import { getPendoConf } from '../../analytics';
import classNames from 'classnames';
import { HelpTopicContext } from '@patternfly/quickstarts';

const ChromeRoute = ({ scope, module, insightsContentRef, scopeClass, ...props }) => {
  const dispatch = useDispatch();
  const { setActiveHelpTopicByName } = useContext(HelpTopicContext);
  const user = useSelector(({ chrome: { user } }) => user);
  /**
   * If default title was not set, use module scope (appId)
   */
  const defaultTitle = useSelector(({ chrome: { modules } }) => modules?.[scope]?.defaultDocumentTitle || scope);
  useEffect(() => {
    batch(() => {
      dispatch(changeActiveModule(scope));
      /**
       * Default document title update. If application won't update its title chrome sets a title using module config
       */
      dispatch(updateDocumentTitle(defaultTitle));
    });
    /**
     * update pendo metadata on application change
     */
    try {
      window?.pendo?.updateOptions(getPendoConf(user));
    } catch (error) {
      console.error('Unable to update pendo options');
      console.error(error);
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

  return (
    <Route key={props.path} {...props}>
      <div className={classNames(scopeClass, scope)}>
        <ScalprumComponent
          ErrorComponent={<ErrorComponent />}
          appName={scope}
          fallback={LoadingFallback}
          LoadingFallback={LoadingFallback}
          scope={scope}
          module={module}
        />
      </div>
    </Route>
  );
};

ChromeRoute.propTypes = {
  scope: PropTypes.string.isRequired,
  module: PropTypes.string,
  path: PropTypes.string.isRequired,
  exact: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
  scopeClass: PropTypes.string,
};

export default ChromeRoute;
