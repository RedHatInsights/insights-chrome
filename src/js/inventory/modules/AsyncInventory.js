import React, { useState, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';

const AsyncInventory = ({ componentName, onLoad, store, history, innerRef, ...props }) => {
  const [Component, setComponent] = useState(Fragment);
  useEffect(() => {
    (async () => {
      const { inventoryConnector, mergeWithDetail, shared, api, ...rest } = await Promise.all([
        import(/* webpackChunkName: "inventoryConnector" */ '@redhat-cloud-services/frontend-components-inventory/inventoryConnector'),
        import(/* webpackChunkName: "inventoryRedux" */ '@redhat-cloud-services/frontend-components-inventory/redux'),
        import(/* webpackChunkName: "inventoryShared" */ '@redhat-cloud-services/frontend-components-inventory/shared'),
        import(/* webpackChunkName: "inventoryApi" */ '@redhat-cloud-services/frontend-components-inventory/api'),
      ]).then(([{ inventoryConnector }, { mergeWithDetail, ...rest }, shared, api]) => ({
        inventoryConnector,
        mergeWithDetail,
        shared,
        api,
        ...rest,
      }));
      const { [componentName]: InvCmp } = inventoryConnector(store, undefined, undefined, true);
      onLoad({
        ...rest,
        ...shared,
        api,
        mergeWithDetail,
      });
      setComponent(() => InvCmp);
    })();
  }, [componentName]);

  return (
    <Provider store={store}>
      <Router history={history}>
        <Component {...props} fallback={LoadingFallback} ref={innerRef} />
      </Router>
    </Provider>
  );
};

AsyncInventory.propTypes = {
  store: PropTypes.object,
  onLoad: PropTypes.func,
  componentName: PropTypes.string,
  history: PropTypes.object,
  innerRef: PropTypes.shape({
    current: PropTypes.any,
  }),
};

AsyncInventory.defaultProps = {
  onLoad: () => undefined,
};

export default AsyncInventory;
