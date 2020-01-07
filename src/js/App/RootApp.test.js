import React from 'react';
import { render } from 'enzyme';
import toJson from 'enzyme-to-json';
import RootApp from './RootApp';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('RootApp', () => {
    let initialState;
    let mockStore;

    beforeEach(() => {
        mockStore = configureStore();
        initialState = {
            chrome: {
                activeApp: 'some-app',
                activeAppTitle: 'some-app-title',
                activeLocation: 'some-location',
                appId: 'app-id'
            }
        };
    });

    it('should render correctly - no data', () => {
        const store = mockStore({ chrome: {} });
        const wrapper = render(
            <Provider store={store}>
                <RootApp/>
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly', () => {
        const store = mockStore(initialState);
        const wrapper = render(
            <Provider store={store}>
                <RootApp />
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with pageAction', () => {
        const store = mockStore({
            chrome: {
                ...initialState.chrome,
                pageAction: 'some-action'
            }
        });
        const wrapper = render(
            <Provider store={store}>
                <RootApp />
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with pageObjectId', () => {
        const store = mockStore({
            chrome: {
                ...initialState.chrome,
                pageObjectId: 'some-object-id'
            }
        });
        const wrapper = render(
            <Provider store={store}>
                <RootApp />
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with pageObjectId and pageAction', () => {
        const store = mockStore({
            chrome: {
                ...initialState.chrome,
                pageAction: 'some-action',
                pageObjectId: 'some-object-id'
            }
        });
        const wrapper = render(
            <Provider store={store}>
                <RootApp />
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
