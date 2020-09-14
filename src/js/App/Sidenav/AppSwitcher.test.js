import React from 'react';
import toJson from 'enzyme-to-json';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import AppSwitcher from './AppSwitcher';

describe('AppSwitcher', () => {
    let initialState;
    let mockStore;
    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({ chrome: {
            activeTechnology: 'someTechnology',
            activeLocation: 'someLocation'
        } });
    });
    it('should render correctly', () =>{
        const store = mockStore(initialState);
        const wrapper = mount(<Provider store={store}>
            <AppSwitcher currentApp='Red Hat Insights'/>
        </Provider>);
        expect(toJson(wrapper, { mode: 'deep' })).toMatchSnapshot();
    });
});
