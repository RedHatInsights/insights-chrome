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

  const setFlagMock = (flags: Record<string, boolean>) => {
    useFlag.mockImplementation((flag: string) => flags[flag] ?? false);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });
  });

  it('should render the empty state with "No results found" title', () => {
    render(<EmptySearchState />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('No results match your criteria.')).toBeInTheDocument();
  });

  it('should hide the VA link when platform.va.environment.enabled flag is disabled', () => {
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });

    render(<EmptySearchState />);

    expect(screen.queryByText(/Virtual Assistant/)).not.toBeInTheDocument();
    expect(screen.getByText(/Try searching Hybrid Cloud help for more information/)).toBeInTheDocument();
  });

  it('should show the VA link when VA flag is enabled and chatbot tab is disabled', () => {
    setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': false });

    render(<EmptySearchState />);

    expect(screen.getByText(/Virtual Assistant/)).toBeInTheDocument();
    expect(screen.getByText(/start a conversation with our/)).toBeInTheDocument();
  });

  it('should hide the VA link when chatbot tab is enabled', () => {
    setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': true });

    render(<EmptySearchState />);

    expect(screen.queryByText(/Virtual Assistant/)).not.toBeInTheDocument();
    expect(screen.getByText(/Try searching Hybrid Cloud help for more information/)).toBeInTheDocument();
  });

  it('should check the correct feature flag names', () => {
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });

    render(<EmptySearchState />);

    expect(useFlag).toHaveBeenCalledWith('platform.va.environment.enabled');
    expect(useFlag).toHaveBeenCalledWith('platform.chrome.help-panel_chatbot');
  });
});
