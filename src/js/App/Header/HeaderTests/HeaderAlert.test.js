import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import HeaderAlert from '../HeaderAlert';

describe('HeaderAlert', () => {
  it('should render correctly not dismissable', () => {
    const { container } = render(<HeaderAlert title="test" dismissDelay={0} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should render correctly dismissable', () => {
    const onDismiss = jest.fn();
    const { container } = render(<HeaderAlert title="test" dismissable={true} onDismiss={onDismiss} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should call onClose on user click', () => {
    const onDismiss = jest.fn();
    const { container } = render(<HeaderAlert title="test" dismissable={true} onDismiss={onDismiss} />);
    const closeButton = container.querySelector('button.pf-c-button.pf-m-plain');
    expect(closeButton).toBeTruthy();
    act(() => {
      fireEvent.click(closeButton);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should close itself after 5000ms delay', async () => {
    const onDismiss = jest.fn();
    jest.useFakeTimers();
    const { container, rerender } = render(<HeaderAlert title="test" dismissable={true} onDismiss={onDismiss} />);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    rerender();
    expect(container.querySelectorAll('div.pf-c-alert')).toHaveLength(0);
  });
});
