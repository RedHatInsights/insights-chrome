import React from 'react';
import Footer from './Footer';

import { shallow } from 'enzyme';

it('renders without crashing!', () => {
    const wrapper = shallow(<Footer />);
    const declaration = <div>I am Footer</div>;
    expect(wrapper.contains(declaration)).toEqual(true);
});
