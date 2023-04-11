import React from 'react';
import Tools, { switchRelease } from '../Tools';
import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../UserToggle', () => () => '<UserToggle />');
jest.mock('../ToolbarToggle', () => () => '<ToolbarToggle />');

jest.mock('@unleash/proxy-client-react', () => {
  const proxyClient = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...proxyClient,
    useFlag: () => {
      return true;
    },
  };
});

describe('Tools', () => {
  it('should render correctly', async () => {
    const mockClick = jest.fn();
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <Provider store={createStore((state = { chrome: { user: {} } }) => state)}>
            <Tools onClick={mockClick} />
          </Provider>
        </MemoryRouter>
      ).container;
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should switch release correctly', () => {
    expect(switchRelease(true, '/beta/settings/rbac')).toEqual(`/settings/rbac`);
    expect(switchRelease(true, '/preview/settings/rbac')).toEqual(`/settings/rbac`);
    expect(switchRelease(false, '/settings/rbac')).toEqual(`/beta/settings/rbac`);
  });
});
