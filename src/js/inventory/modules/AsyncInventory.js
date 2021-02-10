import React, { useState, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import '../inventoryStyles';
import { allDetails, drawer } from '../accountNumbers.json';

const isEnabled = async () => {
  const isExperimentalEnabled = window.localStorage.getItem('chrome:inventory:experimental_detail');
  const { identity } = await insights.chrome.auth.getUser();
  return (
    (isExperimentalEnabled && isExperimentalEnabled !== 'false') ||
    // eslint-disable-next-line camelcase
    (allDetails.includes(identity?.internal?.account_id) && isExperimentalEnabled !== 'false')
  );
};

const isDrawerEnabled = async () => {
  const drawerEnabled = window.localStorage.getItem('chrome:inventory:experimental_drawer');
  const { identity } = await insights.chrome.auth.getUser();
  return (
    (drawerEnabled && drawerEnabled !== 'false') ||
    // eslint-disable-next-line camelcase
    (drawer.includes(identity?.internal?.account_id) && drawerEnabled !== 'false')
  );
};

const AsyncInventory = ({ componentName, onLoad, store, history, innerRef, ...props }) => {
  const [Component, setComponent] = useState(Fragment);
  useEffect(() => {
    (async () => {
      let SystemAdvisoryListStore;
      let SystemCvesStore;
      let systemProfileStore;
      let RenderWrapper;
      const isDetailsEnabled = await isEnabled();
      const drawerEnabled = await isDrawerEnabled();
      if (isDetailsEnabled || drawerEnabled) {
        systemProfileStore = await import(
          /* webpackChunkName: "inventory-gen-info-store" */
          '@redhat-cloud-services/frontend-components-inventory-general-info/redux'
        );
        RenderWrapper = await import(/* webpackChunkName: "inventory-render-wrapper" */ '../RenderWrapper');
      }

      if (isDetailsEnabled) {
        SystemAdvisoryListStore = (
          await import(
            /* webpackChunkName: "inventory-patch-store" */
            '@redhat-cloud-services/frontend-components-inventory-patchman/dist/cjs/SystemAdvisoryListStore'
          )
        )?.SystemAdvisoryListStore;

        SystemCvesStore = (
          await import(
            /* webpackChunkName: "inventory-vuln-store" */
            '@redhat-cloud-services/frontend-components-inventory-vulnerabilities/dist/cjs/SystemCvesStore'
          )
        )?.SystemCvesStore;
      }
      const { inventoryConnector, mergeWithDetail, ...rest } = await import(
        /* webpackChunkName: "inventory" */ '@redhat-cloud-services/frontend-components-inventory/esm'
      );
      const { [componentName]: InvCmp } = inventoryConnector(
        store,
        isDetailsEnabled
          ? {
              componentMapper: RenderWrapper.default,
              appList: [
                { title: 'General information', name: 'general_information', pageId: 'inventory' },
                { title: 'Advisor', name: 'advisor', pageId: 'insights' },
                { title: 'Vulnerability', name: 'vulnerabilities', pageId: 'vulnerability' },
                { title: 'Compliance', name: 'compliance' },
                { title: 'Patch', name: 'patch' },
              ],
            }
          : undefined,
        drawerEnabled ? RenderWrapper.default : undefined,
        true
      );
      const detailMerger = (redux) => ({
        ...mergeWithDetail(redux),
        ...((isDetailsEnabled || drawerEnabled) && { systemProfileStore: systemProfileStore.default }),
        ...(isDetailsEnabled && {
          SystemCvesStore,
          SystemAdvisoryListStore,
        }),
      });
      onLoad({
        ...rest,
        mergeWithDetail: detailMerger,
      });
      setComponent(() => InvCmp);
    })();
  }, [componentName]);

  return (
    <Provider store={store}>
      <Router history={history}>
        <Component {...props} ref={innerRef} />
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
