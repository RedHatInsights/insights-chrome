import React from 'react';
import ConnectedNavigation, { Navigation }  from './Navigation';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

// describe('Navigation', () => {
//     it('should render corectly', () =>{
//         const wrapper = shallow(<Navigation/>);
//         expect(toJson(wrapper)).toMatchSnapshot();
//     });
// });

describe('ConnectedNavigation', () => {
    let initialState;
    let mockStore;

    beforeEach(() =>{
        mockStore = configureStore();
        initialState = ({
            chrome: {
                globalNav: 
            }
        });
    });

    it('should render correctly with empty state', () =>{
        const store = mockStore(({}));
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedNavigation/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render correctly with initial state', () =>{
        const store = mockStore(initialState);
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedNavigation/>
            </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
