import React from 'react';
import Brand from './Brand';
import { render } from 'enzyme';
import toJson from 'enzyme-to-json';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';

// it('renders without crashing!', () => {
//     shallow(<Brand />);
// });

describe('Brand', () => {
    let initialState;
    let mockStore;
    beforeEach(() => {
        mockStore = configureStore();
        initialState = {
            chrome: {
                navHidden: true
            }
        };
    });

    it('should render correctly with initial state', () => {
        const store = mockStore(initialState);
        const wrapper = render(
            <Provider store={store}>
                <Brand/>
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
