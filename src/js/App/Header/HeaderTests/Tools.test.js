import React from 'react';
import Tools from '../Tools';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';

describe('Tools', () => {

    it('should render correctly', () => {
        const wrapper = shallow(
            <Tools/>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
