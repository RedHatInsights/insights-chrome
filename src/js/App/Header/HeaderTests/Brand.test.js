import React from 'react';
import ConnectedBrand, { Brand } from '../Brand';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

describe('Brand', () => {
  let initialState;
  let mockStore;
  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        navHidden: true,
      },
    };
  });

  it('should render correctly with initial state', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedBrand />
      </Provider>
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
  it('should render correctly with state navHidden: false', () => {
    const store = mockStore({ chrome: { navHidden: false } });
    const { container } = render(
      <Provider store={store}>
        <ConnectedBrand />
      </Provider>
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
  it('should render correctly with button', () => {
    const { container } = render(
      <Brand
        toggleNav={() => {
          return;
        }}
        isHidden={true}
      />
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
  it('onClick should fire', () => {
    const mockCallBack = jest.fn();

    const { container } = render(<Brand toggleNav={mockCallBack} navHidden={true} />);
    expect(container.querySelector('div')).toMatchSnapshot();

    container.querySelector(`[data-ouia-component-id='chrome-nav-toggle']`).click();
    expect(mockCallBack).toHaveBeenCalledTimes(1);
  });
  it('mapDispatchToProps function fires', () => {
    const store = mockStore(initialState);
    const { container } = render(<ConnectedBrand store={store} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
