import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { spinUpStore } from '../redux-config';
import RootApp from '../App/RootApp';

import loadInventory from '../inventory/index';
import loadRemediations from '../remediations';

/**
 * This has to be posponed in order to let shared react modules to initialize
 */
window.insights.loadInventory = loadInventory;
window.insights.experimental.loadRemediations = loadRemediations;

const App = () => {
  const config = {
    advisor: {
      name: 'advisor',
      manifestLocation: `${window.location.origin}/apps/advisor/fed-mods.json`,
    },
    inventory: {
      name: 'inventory',
      manifestLocation: `${window.location.origin}/apps/inventory/fed-mods.json`,
    },
    chrome: {
      name: 'chrome',
      manifestLocation: `${window.location.origin}/apps/chrome/js/fed-mods.json`,
    },
  };
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
  }
}

export default renderChrome;
