import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import Header, { unauthed as UnauthedHeader } from '../index';

describe('Header', () => {
    it('should render correctly', () => {
        const wrapper = shallow(<Header/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});

describe('unauthed', () => {
    it('should render correctly', () => {
        const wrapper = shallow(<UnauthedHeader/>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
