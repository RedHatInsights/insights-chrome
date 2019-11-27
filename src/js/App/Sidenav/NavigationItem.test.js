import React from 'react';
import NavigationItem  from './NavigationItem';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';

describe('NavigationItem', () => {
    it('should render coorectly', () =>{
        const wrapper = shallow(<NavigationItem/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('parent with value and itemID undefined', () => {
        let props = { parent: 'someValue' };
        const wrapper = shallow(<NavigationItem {...props}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('parent and itemID with value', () => {
        let props = { parent: 'someValue', itemID: 'someID' };
        const wrapper = shallow(<NavigationItem {...props}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('parent undefined and itemID with value', () => {
        let props = { itemID: 'someID' };
        const wrapper = shallow(<NavigationItem {...props}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
    it('with some navigate value set', () => {
        let navigate = {};
        const wrapper = shallow(<NavigationItem navigate={navigate}/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
