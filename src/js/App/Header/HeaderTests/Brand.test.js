import React from 'react';
import ConnectedBrand, { Brand }  from '../Brand';
import toJson from 'enzyme-to-json';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';

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
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedBrand/>
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('should render correctly with state navHidden: false', () => {
        const store = mockStore({ chrome: { navHidden: false } });
        const wrapper = shallow(
            <Provider store={store}>
                <ConnectedBrand/>
            </Provider>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('should render correctly with button', () => {
        const wrapper = shallow(
            <Brand toggleNav={() => { return; }} isHidden={true}/>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('onClick should fire', () => {

        const mockCallBack = jest.fn();

        const wrapper = shallow(
            <Brand toggleNav={ mockCallBack } navHidden={true}/>
        );
        expect(toJson(wrapper)).toMatchSnapshot();

        wrapper.find(`[widget-type='InsightsNavToggle']`).simulate('click');
        expect(mockCallBack).toHaveBeenCalledTimes(1);
    });
    it('mapDispatchToProps function fires', () => {
        const store = mockStore(initialState);
        const wrapper = shallow(
            <ConnectedBrand store= {store}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
