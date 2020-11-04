import React from 'react';
import ConnectedSideNav from './SideNav';
import toJson from 'enzyme-to-json';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';

describe('ConnectedSideNav', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        activeTechnology: 'someTechnology',
        activeLocation: 'someLocation',
      },
    };
  });
  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <Provider store={store}>
        <ConnectedSideNav />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
  it('should render correctly part 2', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <Provider store={store}>
        <ConnectedSideNav />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
