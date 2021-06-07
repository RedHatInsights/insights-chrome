import React from 'react';
import Footer from './Footer';

import { render } from '@testing-library/react';

it('renders without crashing!', () => {
  const { container } = render(<Footer />);
  expect(container.querySelector('div')).toMatchSnapshot();
});
