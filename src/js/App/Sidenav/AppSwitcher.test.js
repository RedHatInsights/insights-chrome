import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import AppSwitcher from './AppSwitcher';

describe('AppSwitcher', () => {

    it('should render correctly', () =>{
        const wrapper = shallow(<AppSwitcher currentApp='Red Hat Insights'/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
