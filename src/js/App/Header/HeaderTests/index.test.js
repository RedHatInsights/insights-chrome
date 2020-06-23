import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import Header from '../index';
import UnauthedHeader from '../UnAuthtedHeader';

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
