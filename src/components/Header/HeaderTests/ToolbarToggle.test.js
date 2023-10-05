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

  it('should render correctly', async () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    expect(toggleButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should open/close menu correctly', async () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    expect(toggleButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelectorAll('.pf-v5-c-menu__list-item')).toHaveLength(2);
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(container.querySelectorAll('.pf-v5-c-menu__list-item')).toHaveLength(0);
  });

  it('should call onClick menu item callback', async () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    const actionButton = container.querySelector('button.pf-v5-c-menu__item');
    expect(actionButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(actionButton);
    });
    expect(clickSpy).toHaveBeenCalled();
  });
});
