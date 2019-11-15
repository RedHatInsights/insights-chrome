import React from 'react';
import ConnectedNavigation, { Navigation }  from './Navigation';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('Navigation', () => {
    const initialProps = {
        settings: ['someItem', 'someKey'],
        activeApp: 'someApp',
        activeLocation: 'someLocation',
        documentation: 'someDocs'
    };
    it('should render corectly with nav not Hidden', () =>{
        let props = {
            ...initialProps,
            navHidden: false
        };
        const wrapper = shallow(<Navigation { ...props }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('should render corectly with nav Hidden', () =>{
        let props = {
            ...initialProps,
            navHidden: true
        };
        const wrapper = shallow(<Navigation { ...props }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('ConnectedNavigation', () => {
    let initialState;
    let mockStore;
    let globalNavData = require('../../../../testdata/globalNav.json')

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                globalNav: globalNavData,
                activeApp: 'someApp',
                navHidden: false,
                activeLocation: 'someLocation',
                activeGroup: 'someGroup',
                appId: 'someId'
            }
        });
    });

    it('should render correctly with empty state', () =>{
        const store = mockStore(({}));
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedNavigation/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with initial state', () =>{
        const store = mockStore(initialState);
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedNavigation/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
