import { ScalprumComponent } from '@scalprum/react-core';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';
import { useDispatch, useSelector } from 'react-redux';
import { changeActiveModule, toggleGlobalFilter } from '../../redux/actions';
import ErrorComponent from '../ErrorComponent/ErrorComponent';
import { getPendoConf } from '../../analytics';

const ChromeRoute = ({ scope, module, insightsContentRef, dynamic, ...props }) => {
  const dispatch = useDispatch();
  const user = useSelector(({ chrome: { user } }) => user);
  useEffect(() => {
    dispatch(changeActiveModule(scope));
    /**
     * update pendo metadata on application change
     */
    try {
      window.pendo.updateOptions(getPendoConf(user));
    } catch (error) {
      console.error('Unable to update pendo options');
      console.error(error);
    }
  }, [scope]);

  useEffect(() => {
    if (dynamic === false) {
      const contentElement = document.getElementById('root');
      if (contentElement && insightsContentRef) {
        insightsContentRef.current.appendChild(contentElement);
        contentElement.hidden = false;
        contentElement.style.display = 'initial';
      }
    }

    return () => {
      /**
       * Reset global filter when switching application
       */
      dispatch(toggleGlobalFilter(false));
    };
  }, []);

  if (dynamic === false) {
    return null;
  }

  return (
    <Route key={props.path} {...props}>
      <main role="main" className={scope}>
        <ScalprumComponent
          ErrorComponent={<ErrorComponent />}
          appName={scope}
          fallback={LoadingFallback}
          LoadingFallback={LoadingFallback}
          scope={scope}
          module={module}
        />
      </main>
    </Route>
  );
};

ChromeRoute.propTypes = {
  scope: PropTypes.string.isRequired,
  module: PropTypes.string,
  path: PropTypes.string.isRequired,
  exact: PropTypes.bool,
  dynamic: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
};

export default ChromeRoute;
