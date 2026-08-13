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

  const setFlagMock = (flags: Record<string, boolean>) => {
    useFlag.mockImplementation((flag: string) => flags[flag] ?? false);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });
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
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.queryByText(/Contact your org admin with the Virtual Assistant/)).not.toBeInTheDocument();
  });

  it('should show the VA button when VA flag is enabled and chatbot tab is disabled', () => {
    setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': false });

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.getByText(/Contact your org admin with the Virtual Assistant/)).toBeInTheDocument();
  });

  it('should hide the VA button when chatbot tab is enabled', () => {
    setFlagMock({ 'platform.va.environment.enabled': true, 'platform.chrome.help-panel_chatbot': true });

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(screen.queryByText(/Contact your org admin with the Virtual Assistant/)).not.toBeInTheDocument();
  });

  it('should check the correct feature flag names', () => {
    setFlagMock({ 'platform.va.environment.enabled': false, 'platform.chrome.help-panel_chatbot': false });

    render(
      <JotaiProvider>
        <NotFoundRoute />
      </JotaiProvider>
    );

    expect(useFlag).toHaveBeenCalledWith('platform.va.environment.enabled');
    expect(useFlag).toHaveBeenCalledWith('platform.chrome.help-panel_chatbot');
  });
});
