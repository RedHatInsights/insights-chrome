import React from 'react';
import { render } from '@testing-library/react';
import Login from '../Login';

describe('Login', () => {
  it('should render correctly', () => {
    const { container } = render(<Login />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
