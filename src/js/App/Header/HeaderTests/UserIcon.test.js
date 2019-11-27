import React from 'react';
import ConnectedUserIcon, { UserIcon }  from '../UserIcon';
import toJson from 'enzyme-to-json';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';

describe('Connected User Icon', () => {
    let initialState;
    let mockStore;
    beforeEach(() => {
        mockStore = configureStore();
        initialState = {
            chrome: {
                user: {
                    identity: {
                        user: {
                            username: 'test-user'
                        }
                    }
                }
            }
        };
    });

    it('should render correctly with initial state', () => {
        const store = mockStore(initialState);
        const wrapper = mount(
            <Provider store={store}>
                <ConnectedUserIcon/>
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('User Icon', () => {

    it('should render correctly with initial state', () => {
        const account = {
            username: 'test'
        };
        const mockGetImage = jest.fn();
        const wrapper = shallow(
            <UserIcon account={account} getImage = { mockGetImage }/>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
