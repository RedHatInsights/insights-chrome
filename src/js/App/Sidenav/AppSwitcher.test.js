import React from 'react';
import { render } from '@testing-library/react';
import AppSwitcher from './AppSwitcher';

describe('AppSwitcher', () => {
  it('should render correctly', () => {
    const { container } = render(<AppSwitcher currentApp="Red Hat Insights" />);
    expect(container).toMatchSnapshot();
  });
});
