import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import ToolbarToggle from '../ToolbarToggle';

describe('ToolbarToggle', () => {
  const clickSpy = jest.fn();
  const dropdownItems = [
    {
      url: 'url1',
      title: 'title1',
      onClick: clickSpy,
    },
    {
      title: 'title2',
      onClick: clickSpy,
    },
    {
      isHidden: true,
      title: 'title3',
      onClick: clickSpy,
    },
  ];
  const toolbarToggleProps = {
    dropdownItems,
    id: 'foo',
  };

  afterEach(() => {
    clickSpy.mockReset();
  });

  it('should render correctly', () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    expect(toggleButton).toBeTruthy();
    act(() => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should open/close menu correctly', () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    expect(toggleButton).toBeTruthy();
    act(() => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelectorAll('.pf-c-dropdown__menu-item')).toHaveLength(2);
    act(() => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelectorAll('.pf-c-dropdown__menu-item')).toHaveLength(0);
  });

  it('should call onClick menu item callback', () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    act(() => {
      fireEvent.click(toggleButton);
    });
    const actionButton = container.querySelector('button.pf-c-dropdown__menu-item');
    expect(actionButton).toBeTruthy();
    act(() => {
      fireEvent.click(actionButton);
    });
    expect(clickSpy).toHaveBeenCalled();
  });
});
