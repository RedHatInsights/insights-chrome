import React from 'react';
import { render } from '@testing-library/react';
import TestComponent from './test-int-c';

describe('<TestIntC>', () => {
  test('should render', () => {
    render(<TestComponent />);
  });
});
