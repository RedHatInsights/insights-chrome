/* eslint-disable camelcase */
import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow, render } from 'enzyme';
import configureStore from 'redux-mock-store';
import ConnectedUserToggle, { UserToggle } from '../UserToggle';
import { Provider } from 'react-redux';

describe('UserToggle', () => {
    let initialState;
    let mockStore;

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                user: {
                    identity: {
                        account_number: accountNumber,
                        user: {
                            username,
                            first_name,
                            last_name,
                            is_org_admin
                        }
                    }
                }
            }

        }) => ({
            account: {
                number: accountNumber,
                username: username,
                isOrgAdmin: is_org_admin,
                name: `${first_name} ${last_name}`
            }
        });
    });

    it('should render correctly', () =>{
        const store = mockStore(initialState);
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedUserToggle/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
