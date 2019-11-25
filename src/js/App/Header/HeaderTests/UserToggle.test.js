/* eslint-disable quotes */
/* eslint-disable camelcase */
import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow, render } from 'enzyme';
import configureStore from 'redux-mock-store';
import ConnectedUserToggle, { UserToggle } from '../UserToggle';
import { Provider } from 'react-redux';

describe('UserToggle', ()=>{
    it('should render correctly with isSmall false', () =>{
        const props = {
            isOpen: false,
            account: {
                number: 'someNumber',
                name: 'someName'
            },
            isSmall: false,
            extraItems: []
        };
        const mockSelect = jest.fn();
        const wrapper = shallow(
            <UserToggle {...props} onSelect = { mockSelect } />
        );
        expect(toJson(wrapper)).toMatchSnapshot();
        wrapper.find("[widget-type='InsightsOverflowActions']").simulate('select');
    });
    it('should render correctly with isSmall true', () =>{
        const props = {
            isOpen: false,
            account: {
                number: 'someNumber',
                name: 'someName'
            },
            isSmall: true,
            extraItems: []
        };
        const mockSelect = jest.fn();
        const wrapper = shallow(
            <UserToggle {...props} onSelect = { mockSelect } />
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
