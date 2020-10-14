import React from 'react';
import toJson from 'enzyme-to-json';
import { shallow } from 'enzyme';
import LogoutAlert from '../LogoutAlert';

describe('Login', () => {
  it('should render correctly with no content', () => {
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `cs_loggedOut=false`,
    });
    const wrapper = shallow(<LogoutAlert />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with content', () => {
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `cs_loggedOut=true`,
    });
    const mockClose = jest.fn();
    const wrapper = shallow(<LogoutAlert onClose={mockClose} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
