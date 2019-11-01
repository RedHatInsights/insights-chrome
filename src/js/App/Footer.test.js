import React from 'react';
import Footer from './Footer';

import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

it('renders without crashing!', () => {
    const wrapper = shallow(<Footer />);
    expect(toJson(wrapper)).toMatchSnapshot();
});
