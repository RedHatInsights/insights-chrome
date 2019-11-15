/* eslint-disable camelcase */
import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow, render } from 'enzyme';
import configureStore from 'redux-mock-store';
import ConnectedUserToggle, { UserToggle } from '../UserToggle';
import { Provider } from 'react-redux';

describe('UserToggle', ()=>{
    it('should render correctly', () =>{
        const props = {
            isOpen: false,
            account: {
                number: 'someNumber',
                name: 'someName'
            },
            isSmall: false,
            extraItems: []
        };
        const wrapper = shallow(
            <UserToggle {...props}/>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('ConnectedUserToggle', () => {
    let initialState;
    let mockStore;

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                user: {
                    identity: {
                        account_number: 'some accountNumber',
                        user: {
                            username: 'someUsername',
                            first_name: 'someFirstName',
                            last_name: 'someLastName',
                            is_org_admin: false
                        }
                    }
                }
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
