import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import LogoutAlert from './LogoutAlert';
import { render } from 'enzyme';

describe('Login', () => {

    it('should render correctly', () =>{
        const wrapper = shallow(<LogoutAlert />);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

});
