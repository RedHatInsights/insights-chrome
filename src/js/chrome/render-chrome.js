import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, useSelector } from 'react-redux';
import { spinUpStore } from '../redux-config';
import RootApp from '../App/RootApp';
import { isBeta } from '../utils';

import loadRemediations from '../remediations';
import { headerLoader } from '../App/Header';

/**
 * This has to be posponed in order to let shared react modules to initialize
 */
window.insights.loadInventory = () => {
  console.log(
    'Do not use `loadInventory` anymore! We have async inventory https://github.com/RedHatInsights/frontend-components/blob/master/packages/components/src/Inventory/InventoryTable.js '
  );
};
window.insights.experimental.loadRemediations = loadRemediations;

const App = () => {
  const modules = useSelector(({ chrome }) => chrome?.modules);

  const config = modules?.reduce(
    (acc, curr) => ({
      ...acc,
      ...(curr?.[0] || curr),
    }),
    {
      chrome: {
        name: 'chrome',
        manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}/apps/chrome/js/fed-mods.json`,
      },
    }
  );

  return <RootApp config={config} />;
};

function renderChrome() {
  const { store } = spinUpStore();
  const pageRoot = document.querySelector('.pf-c-page__drawer');
  if (pageRoot) {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      pageRoot
    );
  } else {
    headerLoader();
  }
}

export default renderChrome;
