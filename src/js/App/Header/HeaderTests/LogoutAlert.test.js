import React from 'react';
import { render } from '@testing-library/react';
import LogoutAlert from '../LogoutAlert';

describe('Login', () => {
  it('should render correctly with no content', () => {
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `cs_loggedOut=false`,
    });
    const { container } = render(<LogoutAlert />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should render correctly with content', () => {
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `cs_loggedOut=true`,
    });
    const mockClose = jest.fn();
    const { container } = render(<LogoutAlert onClose={mockClose} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
