/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@sentry/browser', () => ({
  __esModule: true,
  captureException: () => 'mock-id',
}));

import ErrorBoundary from './ErrorBoundary';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { chromeInitialState } from '../../redux';

const Throw = ({ undefinedProp }) => {
  // new Error('Expected error');
  return undefinedProp.map(() => <div key="foo">Foo</div>);
};
const DummyComponent = ({ shouldThrow = false }) => (
  <Provider store={createStore(() => chromeInitialState)}>
    <ErrorBoundary>{shouldThrow ? <Throw /> : <button></button>}</ErrorBoundary>;
  </Provider>
);
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
});
