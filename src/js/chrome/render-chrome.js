import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, useSelector } from 'react-redux';
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
  const globalNav = useSelector(({ chrome }) => chrome?.globalNav);

  const config = globalNav?.reduce(
    (acc, curr) => {
      if (curr?.module) {
        const appName = curr.module?.appName || curr.id;
        return {
          ...acc,
          [appName]: {
            name: appName,
            manifestLocation: `${window.location.origin}${curr.module?.manifest || `/apps/${appName}/fed-mods.json`}`,
          },
        };
      }

      return acc;
    },
    {
      chrome: {
        name: 'chrome',
        manifestLocation: `${window.location.origin}/apps/chrome/js/fed-mods.json`,
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
  }
}

export default renderChrome;
