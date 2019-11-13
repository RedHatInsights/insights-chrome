import React from 'react';
import toJson from 'enzyme-to-json';
import { mount } from 'enzyme';
import LogoutAlert from './LogoutAlert';

describe('Login', () => {

    it('should render correctly', () =>{
        const wrapper = mount(<LogoutAlert />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
