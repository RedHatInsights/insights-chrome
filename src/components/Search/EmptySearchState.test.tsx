import React from 'react';
import { render, screen } from '@testing-library/react';
import * as unleashReact from '@unleash/proxy-client-react';
import EmptySearchState from './EmptySearchState';

// Mock Scalprum hooks used in the VA link sub-component
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

describe('EmptySearchState', () => {
  const useFlag = unleashReact.useFlag as jest.MockedFunction<typeof unleashReact.useFlag>;

  beforeEach(() => {
    jest.clearAllMocks();
    useFlag.mockReturnValue(false);
  });

  it('should render the empty state with "No results found" title', () => {
    render(<EmptySearchState />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('No results match your criteria.')).toBeInTheDocument();
  });

  it('should hide the VA link when platform.va.environment.enabled flag is disabled', () => {
    useFlag.mockReturnValue(false);

    render(<EmptySearchState />);

    expect(screen.queryByText(/Virtual Assistant/)).not.toBeInTheDocument();
    expect(screen.getByText(/Try searching Hybrid Cloud help for more information/)).toBeInTheDocument();
  });

  it('should show the VA link when platform.va.environment.enabled flag is enabled', () => {
    useFlag.mockReturnValue(true);

    render(<EmptySearchState />);

    expect(screen.getByText(/Virtual Assistant/)).toBeInTheDocument();
    expect(screen.getByText(/start a conversation with our/)).toBeInTheDocument();
  });

  it('should check the correct feature flag name', () => {
    useFlag.mockReturnValue(false);

    render(<EmptySearchState />);

    expect(useFlag).toHaveBeenCalledWith('platform.va.environment.enabled');
  });
});
