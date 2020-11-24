import React, { useState, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import setDependencies from '../externalDependencies';
import * as pfReact from '@patternfly/react-core';
import * as pfReactTable from '@patternfly/react-table';
import * as ReactRedux from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

const InventoryTable = ({ onLoad, store, history, ...props }) => {
  const [Component, setComponent] = useState(Fragment);
  // TODO: remove this as dependencies will be handled by fed modules
  setDependencies({
    pfReact,
    pfReactTable,
    React,
    ReactRedux,
  });
  useEffect(() => {
    (async () => {
      const { inventoryConnector, ...rest } = await import(
        /* webpackChunkName: "inventory" */ '@redhat-cloud-services/frontend-components-inventory'
      );
      const { InventoryTable } = inventoryConnector();
      onLoad(rest);
      setComponent(() => InventoryTable);
    })();
  }, []);
  return (
    <ReactRedux.Provider store={store}>
      <Router history={history}>
        <Component {...props} />
      </Router>
    </ReactRedux.Provider>
  );
};

InventoryTable.propTypes = {
  store: PropTypes.object,
  onLoad: PropTypes.func,
  history: PropTypes.object,
};

InventoryTable.defaultProps = {
  onLoad: () => undefined,
};

export default InventoryTable;
