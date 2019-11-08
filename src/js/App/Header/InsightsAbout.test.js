import React from 'react';
import { render } from 'enzyme';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import ConnectedInsightsAbout, { InsightsAbout } from './InsightsAbout';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('InsightsAbout', () => {
    let initialState;
    let mockStore;

    beforeEach(() => {
        mockStore = configureStore();
        initialState = {
            chrome: { user: { identity: { user: { username: 'some-name' }  } } }
            // appID: 'someID',
            // activeApp: 'some-app',
            // appDetails: { apps: 'some-apps' },
            // showCopyAlert: false,
            // showCopyAlertError: false,
            // currentApp: 'app' && 'app.title'
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
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
