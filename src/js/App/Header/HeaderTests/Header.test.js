import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import Header from '../Header';
import UnauthedHeader from '../UnAuthtedHeader';

describe('Header', () => {
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
    const wrapper = mount(
      <Provider store={store}>
        <Header currentApp="Red Hat Insights" />
      </Provider>
    );
    expect(toJson(wrapper, { mode: 'deep' })).toMatchSnapshot();
  });
});

describe('unauthed', () => {
  it('should render correctly', () => {
    const wrapper = shallow(<UnauthedHeader />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
