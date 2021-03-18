/* eslint-disable react/prop-types */
import React from 'react';
import { render } from '@testing-library/react';
jest.mock('@sentry/browser', () => ({
  __esModule: true,
  captureException: () => 'mock-id',
}));

import ErrorBoundary from './ErrorBoundary';

const Throw = () => {
  new Error('Expected error');
};
const DummyComponent = ({ shouldThrow = false }) => <ErrorBoundary>{shouldThrow ? <Throw /> : <button></button>}</ErrorBoundary>;
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
    spy.mockImplementation(() => {});
    const { container } = render(<DummyComponent shouldThrow />);
    expect(container).toMatchSnapshot();
    spy.mockRestore();
  });
});
