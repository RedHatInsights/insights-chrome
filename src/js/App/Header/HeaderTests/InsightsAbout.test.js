/* eslint-disable camelcase */
import React from 'react';
import { render } from 'enzyme';
import { shallow, mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import ConnectedInsightsAbout, { InsightsAbout, Copyright } from '../InsightsAbout';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('InsightsAbout', () => {
    beforeEach(() => {
        fetch.resetMocks();
        fetch.mockResponse(JSON.stringify({
            app: 'someApp', data:
                                { src_hash: 'somehash', build_id: 'someID' }
        }));
    });
    const initialProps = {
        activeApp: 'someApp',
        appId: 'someID',
        dispatch: jest.fn(),
        //isModalOpen: true,
        onClose: jest.fn()
    };
    it('should render correctly with modal closed', ()=>{
        let props = {
            ...initialProps,
            isModalOpen: false
        };
        shallow(<InsightsAbout { ...props }/>);
        //expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('should render correctly with modal open', ()=>{
        let props = {
            ...initialProps,
            isModalOpen: true
        };
        // const onResponse = jest.fn();
        // const onError = jest.fn();
        shallow(<InsightsAbout { ...props }/>);
        //expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('ConnectedInsightsAbout', () => {
    let initialState;
    let mockStore;
    let globalNavData = require('../../../../../testdata/globalNav.json');
    beforeEach(() => {
        mockStore = configureStore();
        initialState = {
            chrome: {
                user: {
                    identity: {
                        user: {}
                    }
                },
                appId: 'test',
                globalNav: [globalNavData],
                activeApp: 'test'
            }
        };
    });

    it('should render correctly with no state data', () =>{
        const store = mockStore({ });
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedInsightsAbout />
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with just username', () => {
        const store = mockStore(initialState);
        const wrapper = render(
            <Provider store={store}>
                <ConnectedInsightsAbout />
            </Provider>);
        //wrapper.setState({ isOpen: true });
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('Copyright', () => {
    it('should render', () => {
        const wrapper = shallow(<Copyright/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
