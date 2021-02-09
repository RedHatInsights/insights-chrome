import React from 'react';
import { render } from '@testing-library/react';
import ToolbarToggle from '../ToolbarToggle';

describe('ToolbarToggle', () => {
  it('should render correctly', () => {
    const mockOnClick = jest.fn();
    const toolbarToggleProps = {
      dropdownItems: [
        {
          url: 'url1',
          title: 'title1',
          onClick: mockOnClick,
        },
        {
          title: 'title2',
          onClick: mockOnClick,
        },
      ],
      isOpen: true,
    };
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
