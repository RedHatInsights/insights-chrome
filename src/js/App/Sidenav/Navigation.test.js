import React from 'react';
import ConnectedNavigation, { Navigation, dispatchToProps }  from './Navigation';
import toJson from 'enzyme-to-json';
import { shallow, mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

let settingsData = [{ id: 'overview', title: 'Overview', group: 'insights', active: true, subItems:
    [{ id: 'someID', title: 'Clusters', default: true }] },
{ id: 'rules', title: 'Rules', group: 'insights', active: false },
{ id: 'topics', title: 'Topics', group: 'insights', active: false },
{ title: 'Inventory', id: 'inventory', active: false },
{ title: 'Remediations', id: 'remediations', active: false }];

describe('Navigation', () => {
    const initialProps = {
        settings: settingsData,
        activeApp: 'someApp',
        activeLocation: 'openshift',
        documentation: 'someDocs'
    };
    let initialState;
    let mockStore;
    let globalNavData = require('../../../../testdata/globalNav.json');

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                globalNav: [globalNavData],
                activeApp: 'someApp',
                navHidden: false,
                activeLocation: 'someLocation',
                activeGroup: 'someGroup',
                appId: 'someId'
            }
        });
        const pathname = '/';
        Object.defineProperty(window, 'location', {
            value: {
                pathname: pathname
            },
            writable: true
        });
    });
    it('should render corectly', () =>{
        let props = {
            ...initialProps,
            appId: 'overview',
            activeGroup: 'someID'
        };
        const mockSelect = jest.fn();
        const mockClick = jest.fn();
        const store = mockStore(initialState);
        const wrapper = shallow(<Navigation onSelect={ mockSelect } onClick={ mockClick } store={ store }{ ...props }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
        wrapper.find(`[itemID='someID']`).simulate('click', { persist: jest.fn() });
        wrapper.find(`[itemID='rules']`).simulate('click', { persist: jest.fn() });
        wrapper.find(`[aria-label='Insights Global Navigation']`).simulate('select', { groupId: 'someID1', itemID: 'someID2' });

    });
    it('should render correctly 2', () =>{
        let props = {
            ...initialProps,
            appId: 'overview',
            activeGroup: 'insights'
        };
        const mockSelect = jest.fn();
        const mockClick = jest.fn();
        const mockNavigate = jest.fn();
        const mockClear = jest.fn();
        const store = mockStore(initialState);
        const wrapper = shallow(<Navigation onSelect= { mockSelect } onClick={ mockClick }
            onNavigate={ mockNavigate } onClearActive = { mockClear } store={ store }{ ...props }/>);
        expect(toJson(wrapper)).toMatchSnapshot();
        wrapper.find(`[itemID='rules']`).simulate('click', { persist: jest.fn() });

    });
});

describe('ConnectedNavigation', () => {
    let initialState;
    let mockStore;
    let globalNavData = require('../../../../testdata/globalNav.json');

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                globalNav: [globalNavData],
                activeApp: 'someApp',
                navHidden: false,
                activeLocation: 'someLocation',
                activeGroup: 'someGroup',
                appId: 'someId'
            }
        });
    });

    it('should render correctly with initial state', () =>{
        const store = mockStore(initialState);
        const wrapper = mount(
            <Provider store={store}>
                <ConnectedNavigation/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('mapDispatchToProps function fires', () => {
        const store = mockStore(initialState);
        const wrapper = mount(
            <ConnectedNavigation store= {store}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
        const mockDispatch = jest.fn();
        const actionProps = dispatchToProps(mockDispatch);
        actionProps.onNavigate(jest.fn(), jest.fn());
        actionProps.onClearActive();
        expect(mockDispatch.mock.calls.length).toBe(2);
    });

});
