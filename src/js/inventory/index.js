/* eslint-disable react/display-name */
import React, { Fragment } from 'react';
import setDependencies from '../externalDependencies';
import { allDetails, drawer } from './accountNumbers.json';

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

export default async (dependencies) => {
  let systemProfileStore;

  setDependencies(dependencies);

  const isDetailsEnabled = await isEnabled();
  const drawerEnabled = await isDrawerEnabled();
  const invData = await import(/* webpackChunkName: "inventory" */ '@redhat-cloud-services/frontend-components-inventory');

  console.log(invData);
  return {
    ...invData,
    inventoryConnector: (store) =>
      invData.inventoryConnector(
        store,
        isDetailsEnabled
          ? {
              componentMapper: Fragment,
              appList: [
                { title: 'General information', name: 'general_information', pageId: 'inventory' },
                { title: 'Advisor', name: 'advisor', pageId: 'insights' },
                { title: 'Vulnerability', name: 'vulnerabilities', pageId: 'vulnerability' },
                { title: 'Compliance', name: 'compliance' },
                { title: 'Patch', name: 'patch' },
              ],
            }
          : undefined,
        drawerEnabled ? Fragment : undefined,
        true
      ),
    mergeWithDetail: (redux) => ({
      ...invData.mergeWithDetail(redux),
      ...((isDetailsEnabled || drawerEnabled) && { systemProfileStore: systemProfileStore.default }),
      ...(isDetailsEnabled && {
        SystemCvesStore: () => <h1>SystemCvesStore is disabled</h1>,
        SystemAdvisoryListStore: () => <h1>SystemAdvisoryListStore is disabled</h1>,
      }),
    }),
  };
};
