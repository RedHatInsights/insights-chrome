import { ScalprumComponent } from '@scalprum/react-core';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';
import { useDispatch } from 'react-redux';
import { changeActiveModule } from '../../redux/actions';

const ChromeRoute = ({ scope, module, insightsContentRef, dynamic, ...props }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(changeActiveModule(scope));
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
  }, []);

  if (dynamic === false) {
    return null;
  }

  return (
    <Route key={props.path} {...props}>
      <main role="main" className={scope}>
        <ScalprumComponent appName={scope} fallback={LoadingFallback} LoadingFallback={LoadingFallback} scope={scope} module={module} />
      </main>
    </Route>
  );
};

ChromeRoute.propTypes = {
  scope: PropTypes.string.isRequired,
  module: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  exact: PropTypes.bool,
  dynamic: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
};

export default ChromeRoute;
