import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import Login from '../Login';

describe('Login', () => {
  it('should render correctly', () => {
    const wrapper = shallow(<Login />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
