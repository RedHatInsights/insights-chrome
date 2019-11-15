import React from 'react';
import NavigationItem  from './NavigationItem';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';

describe('NavigationItem', () => {
    it('should render coorectly', () =>{
        const wrapper = shallow(<NavigationItem/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
