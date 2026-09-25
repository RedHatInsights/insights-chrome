import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ScalprumComponent } from '@scalprum/react-core';
import QuickstartsRuntimeMount, {
  LEARNING_RESOURCES_QUICKSTARTS_FLAG,
  LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY,
  REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS,
} from './QuickstartsRuntimeMount';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: jest.fn(({ children }: { children?: React.ReactNode }) => <div data-testid="remote-runtime">{children}</div>),
}));

jest.mock('./LegacyQuickstartsRuntime', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="legacy-runtime">{children}</div>,
}));

const mockedUseFlag = useFlag as jest.Mock;
const MockedScalprumComponent = ScalprumComponent as jest.Mock;

const chromeAuth = {
  user: {
    identity: {
      internal: { account_id: '123' },
    },
  },
};

const renderMount = () => {
  const store = createStore();
  store.set(activeModuleAtom, 'insights');
  store.set(degradedStateAtom, {
    userPersonalization: false,
    entitlements: false,
    configFromCache: false,
    featureFlags: false,
    quickstarts: false,
  });
  return {
    store,
    ...render(
      <JotaiProvider store={store}>
        <ChromeAuthContext.Provider value={chromeAuth as never}>
          <QuickstartsRuntimeMount>
            <span>shell-child</span>
          </QuickstartsRuntimeMount>
        </ChromeAuthContext.Provider>
      </JotaiProvider>
    ),
  };
};

describe('QuickstartsRuntimeMount', () => {
  beforeEach(() => {
    mockedUseFlag.mockReturnValue(false);
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
    MockedScalprumComponent.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
  });

  it('uses leftover Chrome providers when the flag is off', () => {
    const { store } = renderMount();

    expect(screen.getByTestId('legacy-runtime')).toBeInTheDocument();
    expect(screen.getByText('shell-child')).toBeInTheDocument();
    expect(screen.queryByTestId('remote-runtime')).not.toBeInTheDocument();
    expect(mockedUseFlag).toHaveBeenCalledWith(LEARNING_RESOURCES_QUICKSTARTS_FLAG);
    expect(store.get(degradedStateAtom).quickstarts).toBe(false);
  });

  it('loads learning-resources QuickstartsRuntime when the Unleash flag is on', () => {
    mockedUseFlag.mockReturnValue(true);
    renderMount();

    expect(screen.getByTestId('remote-runtime')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-runtime')).not.toBeInTheDocument();
    expect(MockedScalprumComponent).toHaveBeenCalled();
    const props = MockedScalprumComponent.mock.calls[0][0];
    expect(props.scope).toBe('learningResources');
    expect(props.module).toBe('./QuickstartsRuntime');
    expect(props.accountId).toBe('123');
  });

  it('loads the remote when localStorage override is set', () => {
    window.localStorage.setItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY, 'true');
    renderMount();

    expect(screen.getByTestId('remote-runtime')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-runtime')).not.toBeInTheDocument();
  });

  it('marks quickstarts degraded if the remote never becomes ready', () => {
    mockedUseFlag.mockReturnValue(true);
    jest.useFakeTimers();
    const { store } = renderMount();

    expect(store.get(degradedStateAtom).quickstarts).toBe(false);
    act(() => {
      jest.advanceTimersByTime(REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
    });
    expect(store.get(degradedStateAtom).quickstarts).toBe(true);
  });

  it('clears degraded state when onApiReady fires', () => {
    mockedUseFlag.mockReturnValue(true);
    const { store } = renderMount();
    const props = MockedScalprumComponent.mock.calls[0][0];

    act(() => {
      store.set(degradedStateAtom, { ...store.get(degradedStateAtom), quickstarts: true });
      props.onApiReady({
        quickstartsAPI: { version: 1 },
        helpTopicsAPI: {},
      });
    });

    expect(store.get(degradedStateAtom).quickstarts).toBe(false);
  });
});
