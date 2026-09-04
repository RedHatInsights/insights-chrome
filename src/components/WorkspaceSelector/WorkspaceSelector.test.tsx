import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import WorkspaceSelector from './WorkspaceSelector';
import { selectedWorkspaceAtom } from '../../state/atoms/workspaceSelectorAtom';

type WorkspaceSelectorRemoteProps = {
  onSelect?: (workspace: { id?: string; name?: string }) => void;
  scope?: string;
  module?: string;
  ErrorComponent?: React.ReactElement;
  fallback?: React.ReactNode;
  menuWidth?: string;
};

const mockUseFlag = jest.fn().mockReturnValue(false);
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (...args: unknown[]) => mockUseFlag(...args),
}));

let capturedProps: WorkspaceSelectorRemoteProps | null = null;
jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: (props: WorkspaceSelectorRemoteProps) => {
    capturedProps = props;
    return <div data-testid="scalprum-mock">ScalprumComponent</div>;
  },
}));

jest.mock('../Routes/SilentErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@patternfly/react-core/dist/dynamic/components/Skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton-mock">Loading...</div>,
}));

const renderComponent = () => {
  const store = createStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <WorkspaceSelector />
      </Provider>
    ),
  };
};

describe('WorkspaceSelector', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(false);
    capturedProps = null;
  });

  it('should return null when feature flag is disabled', () => {
    const { container } = renderComponent();
    expect(container.innerHTML).toBe('');
  });

  it('should render ScalprumComponent when feature flag is enabled', () => {
    mockUseFlag.mockReturnValue(true);
    renderComponent();
    expect(screen.getByTestId('workspace-selector')).toBeTruthy();
    expect(screen.getByTestId('scalprum-mock')).toBeTruthy();
  });

  it('should pass correct scope and module to ScalprumComponent', () => {
    mockUseFlag.mockReturnValue(true);
    renderComponent();
    expect(capturedProps?.scope).toBe('rbac');
    expect(capturedProps?.module).toBe('./modules/WorkspaceSelector');
  });

  it('should check the correct feature flag name', () => {
    renderComponent();
    expect(mockUseFlag).toHaveBeenCalledWith('platform.chrome.workspace-global_selector');
  });

  it('should pass ErrorComponent for silent failure', () => {
    mockUseFlag.mockReturnValue(true);
    renderComponent();
    expect(capturedProps?.ErrorComponent).toBeDefined();
  });

  it('should pass a fallback for loading state', () => {
    mockUseFlag.mockReturnValue(true);
    renderComponent();
    expect(capturedProps?.fallback).toBeDefined();
  });

  it('should update selectedWorkspaceAtom when onSelect is called', () => {
    mockUseFlag.mockReturnValue(true);
    const { store } = renderComponent();
    capturedProps?.onSelect?.({ id: 'ws-1', name: 'Production' });
    expect(store.get(selectedWorkspaceAtom)).toEqual({ id: 'ws-1', name: 'Production' });
  });

  it('should not update atom when workspace has missing fields', () => {
    mockUseFlag.mockReturnValue(true);
    const { store } = renderComponent();
    capturedProps?.onSelect?.({ id: 'ws-1' });
    expect(store.get(selectedWorkspaceAtom)).toBeUndefined();
  });
});
