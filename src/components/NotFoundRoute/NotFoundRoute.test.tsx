/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import * as unleashReact from '@unleash/proxy-client-react';
import NotFoundRoute from './NotFoundRoute';

// Mock Scalprum hooks used in the VA button sub-component
jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: jest.fn(() => ({
    hookResult: [null, jest.fn()],
    loading: false,
  })),
  useLoadModule: jest.fn(() => [{ VA: 'test-model' }]),
}));

// Mock unleash feature flags
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

// Mock InvalidObject
jest.mock('@redhat-cloud-services/frontend-components/InvalidObject', () => ({
  InvalidObject: () => <div data-testid="invalid-object">Not Found</div>,
}));

describe('NotFoundRoute', () => {
  const useFlag = unleashReact.useFlag as jest.MockedFunction<typeof unleashReact.useFlag>;

  beforeEach(() => {
    jest.clearAllMocks();
    useFlag.mockReturnValue(false);
  });

  it('should render the 404 empty state', () => {
    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.getByTestId('invalid-object')).toBeInTheDocument();
  });

  it('should hide the VA button when platform.va.environment.enabled flag is disabled', () => {
    useFlag.mockReturnValue(false);

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.queryByText(/Contact your org admin with the Virtual Assistant/)).not.toBeInTheDocument();
  });

  it('should show the VA button when platform.va.environment.enabled flag is enabled', () => {
    useFlag.mockReturnValue(true);

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.getByText(/Contact your org admin with the Virtual Assistant/)).toBeInTheDocument();
  });

  it('should check the correct feature flag name', () => {
    useFlag.mockReturnValue(false);

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(useFlag).toHaveBeenCalledWith('platform.va.environment.enabled');
  });
});
