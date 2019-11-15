/* eslint-disable camelcase */
import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow, render } from 'enzyme';
import configureStore from 'redux-mock-store';
import ConnectedUserToggle, { UserToggle } from './UserToggle';
import { Provider } from 'react-redux';

describe('UserToggle', () => {
    let initialState;
    let mockStore;

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = {
            chrome: {
                user: {
                    identity: {
                        account: {
                            number: 'someAccountNumber',
                            username: 'someUserName',
                            isOrgAdmin: 'someBoolean',
                            name: `${'someFirstName'} ${'someLastName'}`
                        }
                    }
                }
            }

        };
    });

    it('should render correctly', () =>{
        const store = mockStore(initialState);
        const wrapper = render(
            <Provider store={store}>
                <ConnectedUserToggle/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
