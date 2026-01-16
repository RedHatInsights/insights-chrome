import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      await fireEvent.click(toggleButton);
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should open/close menu correctly', async () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    const expectedTexts = toolbarToggleProps.dropdownItems.filter((item) => !item.isHidden);
    expect(toggleButton).toBeInTheDocument();
    await act(async () => {
      await fireEvent.click(toggleButton);
    });

    // wait for async actions on toggle to complete
    await act(async () => {
      await Promise.resolve();
    });

    for (const item of expectedTexts) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }
    // closes button
    await act(async () => {
      await fireEvent.click(toggleButton);
    });

    // wait for async actions on toggle to complete
    await waitFor(async () => {
      for (const item of expectedTexts) {
        expect(screen.queryByText(item.title)).not.toBeInTheDocument();
      }
    });
    // expect(container.querySelectorAll('.pf-v6-c-menu__list-item')).toHaveLength(0);
  });

  it('should call onClick menu item callback', async () => {
    const { container } = render(<ToolbarToggle {...toolbarToggleProps} />);
    const toggleButton = container.querySelector('#foo');
    await act(async () => {
      await fireEvent.click(toggleButton);
    });
    const actionButton = container.querySelector('button.pf-v6-c-menu__item');
    expect(actionButton).toBeTruthy();
    await act(async () => {
      await fireEvent.click(actionButton);
    });
    expect(clickSpy).toHaveBeenCalled();
  });
});
