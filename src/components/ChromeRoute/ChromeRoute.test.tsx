/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { ChromeRouteProps } from './ChromeRoute';
import ChromeRoute from './ChromeRoute';
import { render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import { RouteDefinition } from '../../@types/types';
import { useScalprum } from '@scalprum/react-core';
import { Scalprum } from '@scalprum/core';
import { mockComponent } from 'react-dom/test-utils';

jest.mock('@scalprum/core');
// jest.mock('@scalprum/react-core');
// jest.mock('../../bootstrap');

jest.mock('@scalprum/react-core', () => ({
  useScalprum: () => true,
  ...jest.requireActual('@scalprum/react-core'),
}));

describe('Optional Props', () => {
  const mockStore = createMockStore();
  test('Props are passed', () => {
    const validProps = { bundle: 'settings', wainscott: 'weasel' };
    const chromeRouteProps: ChromeRouteProps = {
      scope: 'lighthouse',
      module: 'lighthouse',
      path: '/lighthouse',
      props: validProps,
      scopeClass: 'chr-scope__default-layout',
    };
    const store = mockStore({
      chrome: {
        activeModule: 'lighthouse',
        modules: {
          lighthouse: {
            manifestLocation: '/apps/lighthouse/fed-mods.json',
          },
        },
        moduleRoutes: [],
      },
    });
    const app: RouteDefinition = {
      scope: 'lighthouse',
      module: 'lighthouse',
      path: '/lighthouse',
      manifestLocation: '/apps/lighthouse/fed-mods.json',
      props: validProps,
    };

    const { getByTestId } = render(
      <Provider store={store}>
        <ChromeRoute {...chromeRouteProps} {...app} />
      </Provider>
    );

    expect(getByTestId('my-element')).toHaveAttribute('props', validProps);
  });
});
