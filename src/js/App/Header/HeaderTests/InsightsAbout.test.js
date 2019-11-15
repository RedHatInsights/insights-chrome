import React from 'react';
import { render } from 'enzyme';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import ConnectedInsightsAbout, { InsightsAbout, Copyright } from '../InsightsAbout';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('ConnectedInsightsAbout', () => {
    let initialState;
    let mockStore;

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
                globalNav: [{
                    item: {
                        active: 'test'
                    }
                }],
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
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('Copyright', () => {
    it('should render', () => {
        const wrapper = shallow(<Copyright/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
