import React from 'react';
import Tools from '../Tools';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';

describe('Tools', () => {
  it('should render correctly', () => {
    const mockClick = jest.fn();
    const wrapper = shallow(<Tools onClick={mockClick} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
