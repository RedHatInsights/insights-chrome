import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.mock('@sentry/browser', () => ({
  __esModule: true,
  captureException: () => 'mock-id',
}));

import ErrorBoundary from './ErrorBoundary';

const Throw = ({ undefinedProp }) => {
  // new Error('Expected error');
  return undefinedProp.map(() => <div key="foo">Foo</div>);
};
const DummyComponent = ({ shouldThrow = false }) => <ErrorBoundary>{shouldThrow ? <Throw /> : <button>OK</button>}</ErrorBoundary>;
describe('ErrorBoundary', () => {
  test('should render component with no error', () => {
    const { container } = render(<DummyComponent />);
    const button = container.querySelectorAll('button');
    expect(button).toHaveLength(1);
  });

  test('should render error boundary', () => {
    /**
     * we don't want the error stack here because we expect it
     */
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => undefined);
    render(<DummyComponent shouldThrow />);
    expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
    spy.mockRestore();
  });

  test('should render Try again button that resets error state', async () => {
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => undefined);

    let shouldThrow = true;
    const MaybeThrow = () => {
      if (shouldThrow) {
        throw new Error('test error');
      }
      return <button>OK</button>;
    };

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    // Stop throwing before clicking reset so the boundary can recover
    shouldThrow = false;

    await act(async () => {
      await userEvent.click(screen.getByText('Try again'));
    });

    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    spy.mockRestore();
  });
});
