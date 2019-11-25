/* eslint-disable camelcase */
import React from 'react';
import { render } from 'enzyme';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import ConnectedInsightsAbout, { InsightsAbout, Copyright } from '../InsightsAbout';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('InsightsAbout', () => {
    beforeEach(() => {
        fetch.resetMocks();
        fetch.mockResponse(JSON.stringify({ app_name: 'chrome', src_hash: 'f3d0275e021cfa46982fd9a4376bda7a5ee9e079', src_tag: 'someTag',
            src_branch: 'prod-stable', travis: { event_type: 'push' }, build_branch: 'prod-stable',
            build_hash: 'b5b92cf36f81fec1c9abc302a365bff111b9f5b0', build_id: '7' }));
    });
    let globalNavData = require('../../../../../testdata/globalNav.json');

    const initialProps = {
        activeApp: 'someApp',
        appId: 'someID',
        dispatch: jest.fn(),
        onClose: jest.fn(),
        user: 'someUser',
        globalNav: [globalNavData]
    };
    it('should render correctly with modal closed', ()=>{
        let props = {
            ...initialProps,
            isModalOpen: false
        };
        shallow(<InsightsAbout { ...props }/>);
    });
    it('should render correctly with modal open', ()=>{
        let props = {
            ...initialProps,
            isModalOpen: true
        };
        shallow(<InsightsAbout { ...props }/>);
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
