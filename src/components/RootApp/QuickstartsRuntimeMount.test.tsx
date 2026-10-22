import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  AllQuickStartStates,
  HelpTopic,
  HelpTopicContainer,
  HelpTopicContext,
  QuickStart,
  QuickStartCatalogPage,
  QuickStartContainer,
  QuickStartContext,
} from '@patternfly/quickstarts';
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
import { remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';
import { resetDelegatedChromeQuickstartsState } from '../../state/atoms/delegatedChromeQuickstarts';
import { quickstartsRuntimeContextAtom } from '../../state/atoms/quickstartsRuntimeContextAtom';

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

const renderMount = (initialActiveQuickStartID = '', children: React.ReactNode = <span>shell-child</span>) => {
  const store = createStore();
  store.set(activeModuleAtom, 'insights');
  store.set(remoteActiveQuickStartIDAtom, initialActiveQuickStartID);
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
          <QuickstartsRuntimeMount>{children}</QuickstartsRuntimeMount>
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
    resetDelegatedChromeQuickstartsState();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
    resetDelegatedChromeQuickstartsState();
    MockedScalprumComponent.mockImplementation(({ children }: { children?: React.ReactNode }) => <div data-testid="remote-runtime">{children}</div>);
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
    expect(screen.getByText('shell-child')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-runtime')).not.toBeInTheDocument();
    expect(MockedScalprumComponent).toHaveBeenCalled();
    const props = MockedScalprumComponent.mock.calls[0][0];
    expect(props.scope).toBe('learningResources');
    expect(props.module).toBe('./QuickstartsRuntime');
    expect(props.accountId).toBe('123');
    expect(props.fallback).toBeNull();
    expect(React.isValidElement(props.children)).toBe(true);
    expect((props.children as React.ReactElement).props['data-ouia-component-id']).toBe('chrome-quickstarts-slot');
    expect(screen.getByTestId('remote-runtime')).toHaveTextContent('shell-child');
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

  it('clears a stale remote quickstart id if the remote never becomes ready', () => {
    mockedUseFlag.mockReturnValue(true);
    jest.useFakeTimers();
    const { store } = renderMount();

    act(() => {
      store.set(remoteActiveQuickStartIDAtom, 'stale-quickstart');
      jest.advanceTimersByTime(REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
    });

    expect(store.get(degradedStateAtom).quickstarts).toBe(true);
    expect(store.get(remoteActiveQuickStartIDAtom)).toBe('');
  });

  it('clears a stale remote quickstart id when the remote ErrorComponent mounts', () => {
    mockedUseFlag.mockReturnValue(true);
    MockedScalprumComponent.mockImplementation(({ ErrorComponent }: { ErrorComponent?: React.ReactNode }) => <>{ErrorComponent}</>);
    const { store } = renderMount('stale-quickstart');

    expect(store.get(degradedStateAtom).quickstarts).toBe(true);
    expect(store.get(remoteActiveQuickStartIDAtom)).toBe('');
    expect(screen.getByText('shell-child')).toBeInTheDocument();
  });

  it('portals chrome children into the remote placeholder', () => {
    mockedUseFlag.mockReturnValue(true);
    renderMount();

    expect(screen.getByTestId('remote-runtime')).toHaveTextContent('shell-child');
  });

  it('keeps chrome children mounted when the remote goes loading -> ready -> failed', () => {
    mockedUseFlag.mockReturnValue(true);
    let setRemoteReady: ((ready: boolean) => void) | undefined;
    MockedScalprumComponent.mockImplementation(({ children }: { children?: React.ReactNode }) => {
      const [ready, setReady] = React.useState(false);
      setRemoteReady = setReady;
      return <div data-testid="remote-runtime">{ready ? children : null}</div>;
    });

    const observed: { mounts: number; nodes: (HTMLElement | null)[] } = { mounts: 0, nodes: [] };
    const Probe = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      React.useLayoutEffect(() => {
        observed.mounts += 1;
        observed.nodes.push(ref.current);
      }, []);
      return <div ref={ref}>shell-child</div>;
    };

    renderMount('', <Probe />);
    const initialNode = observed.nodes[0];
    expect(observed.mounts).toBe(1);
    expect(initialNode && document.contains(initialNode)).toBe(true);
    expect(screen.getByTestId('remote-runtime')).not.toHaveTextContent('shell-child');

    act(() => setRemoteReady?.(true));
    expect(observed.mounts).toBe(1);
    expect(screen.getByTestId('remote-runtime')).toHaveTextContent('shell-child');
    expect(screen.getByTestId('remote-runtime').contains(initialNode)).toBe(true);

    act(() => setRemoteReady?.(false));
    expect(observed.mounts).toBe(1);
    expect(initialNode && document.contains(initialNode)).toBe(true);
    expect(screen.getByText('shell-child')).toBe(initialNode);
    expect(screen.getByTestId('remote-runtime')).not.toHaveTextContent('shell-child');
  });

  it('mounts chrome children attached to the document so layout measurements work', () => {
    mockedUseFlag.mockReturnValue(true);
    let attachedDuringLayoutEffect: boolean | undefined;
    const Probe = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      React.useLayoutEffect(() => {
        attachedDuringLayoutEffect = !!ref.current && document.contains(ref.current);
      }, []);
      return <div ref={ref}>shell-child</div>;
    };

    renderMount('', <Probe />);

    expect(attachedDuringLayoutEffect).toBe(true);
  });

  describe('runtime context bridge', () => {
    const runtimeQuickStarts: QuickStart[] = [
      {
        metadata: { name: 'runtime-qs-a' },
        spec: { displayName: 'Runtime quickstart A', description: 'First runtime quickstart', icon: '', tasks: [{ title: 'Step 1' }] },
      },
      {
        metadata: { name: 'runtime-qs-b' },
        spec: { displayName: 'Runtime quickstart B', description: 'Second runtime quickstart', icon: '', tasks: [{ title: 'Step 1' }] },
      },
    ];
    const runtimeHelpTopics: HelpTopic[] = [{ name: 'runtime-topic', title: 'Runtime topic', tags: [], content: 'Topic content' }];

    /** Stand-in for LR's QuickstartsRuntime: owns its state and renders the real PF providers around `children`. */
    const RuntimeWithProviders = ({
      children,
      onActiveQuickStartChanged,
    }: {
      children?: React.ReactNode;
      onActiveQuickStartChanged?: (id: string) => void;
    }) => {
      const [activeQuickStartID, setActiveQuickStartID] = React.useState('');
      const [allQuickStartStates, setAllQuickStartStates] = React.useState<AllQuickStartStates>({});
      React.useEffect(() => {
        onActiveQuickStartChanged?.(activeQuickStartID);
      }, [activeQuickStartID, onActiveQuickStartChanged]);
      return (
        <QuickStartContainer
          quickStarts={runtimeQuickStarts}
          activeQuickStartID={activeQuickStartID}
          setActiveQuickStartID={setActiveQuickStartID}
          allQuickStartStates={allQuickStartStates}
          setAllQuickStartStates={setAllQuickStartStates}
          useQueryParams={false}
        >
          <HelpTopicContainer helpTopics={runtimeHelpTopics}>{children}</HelpTopicContainer>
        </QuickStartContainer>
      );
    };

    let setRemoteState: ((state: 'loading' | 'ready' | 'failed') => void) | undefined;
    const originalScrollTo = Element.prototype.scrollTo;

    beforeAll(() => {
      // jsdom has no Element.scrollTo; the PF drawer calls it when a quickstart opens.
      Element.prototype.scrollTo = jest.fn();
    });

    afterAll(() => {
      Element.prototype.scrollTo = originalScrollTo;
    });

    beforeEach(() => {
      mockedUseFlag.mockReturnValue(true);
      setRemoteState = undefined;
      MockedScalprumComponent.mockImplementation(
        ({
          children,
          ErrorComponent,
          onActiveQuickStartChanged,
        }: {
          children?: React.ReactNode;
          ErrorComponent?: React.ReactNode;
          onActiveQuickStartChanged?: (id: string) => void;
        }) => {
          const [state, setState] = React.useState<'loading' | 'ready' | 'failed'>('ready');
          setRemoteState = setState;
          if (state === 'failed') {
            return <>{ErrorComponent}</>;
          }
          return (
            <div data-testid="remote-runtime">
              {state === 'ready' ? <RuntimeWithProviders onActiveQuickStartChanged={onActiveQuickStartChanged}>{children}</RuntimeWithProviders> : null}
            </div>
          );
        }
      );
    });

    const ContextProbe = () => {
      const { allQuickStarts = [], activeQuickStartID } = React.useContext(QuickStartContext);
      const { helpTopics = [] } = React.useContext(HelpTopicContext);
      return (
        <>
          <span data-testid="probe-quickstarts">{allQuickStarts.map(({ metadata }) => metadata.name).join(',')}</span>
          <span data-testid="probe-active">{activeQuickStartID}</span>
          <span data-testid="probe-topics">{helpTopics.map(({ name }) => name).join(',')}</span>
        </>
      );
    };

    it('gives portalled chrome children the runtime QuickStartContext and HelpTopicContext', () => {
      const { store } = renderMount('', <ContextProbe />);

      expect(screen.getByTestId('remote-runtime')).toContainElement(screen.getByTestId('probe-quickstarts'));
      expect(screen.getByTestId('probe-quickstarts')).toHaveTextContent('runtime-qs-a,runtime-qs-b');
      expect(screen.getByTestId('probe-topics')).toHaveTextContent('runtime-topic');
      expect(store.get(quickstartsRuntimeContextAtom)?.quickStart.allQuickStarts).toEqual(runtimeQuickStarts);
    });

    it('renders the runtime quickstarts in a catalog inside the console tree', () => {
      renderMount('', <QuickStartCatalogPage showFilter={false} showTitle={false} />);

      expect(screen.getByText('Runtime quickstart A')).toBeInTheDocument();
      expect(screen.getByText('Runtime quickstart B')).toBeInTheDocument();
    });

    it('starts the quickstart in the runtime when a console catalog tile is clicked', () => {
      const { store } = renderMount(
        '',
        <>
          <QuickStartCatalogPage showFilter={false} showTitle={false} />
          <ContextProbe />
        </>
      );

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Runtime quickstart A' }));
      });

      expect(store.get(remoteActiveQuickStartIDAtom)).toBe('runtime-qs-a');
      expect(screen.getByTestId('probe-active')).toHaveTextContent('runtime-qs-a');
    });

    it('updates the bridged context without remounting the console or re-rendering the remote', () => {
      let mounts = 0;
      const MountCounter = () => {
        React.useLayoutEffect(() => {
          mounts += 1;
        }, []);
        return null;
      };
      renderMount(
        '',
        <>
          <MountCounter />
          <QuickStartCatalogPage showFilter={false} showTitle={false} />
          <ContextProbe />
        </>
      );
      const remoteRenders = MockedScalprumComponent.mock.calls.length;

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Runtime quickstart B' }));
      });

      expect(screen.getByTestId('probe-active')).toHaveTextContent('runtime-qs-b');
      expect(mounts).toBe(1);
      expect(MockedScalprumComponent.mock.calls.length).toBe(remoteRenders);
    });

    it('falls back to default context values while loading and after the remote fails, keeping children mounted', () => {
      let mounts = 0;
      const MountCounter = () => {
        React.useLayoutEffect(() => {
          mounts += 1;
        }, []);
        return null;
      };
      const { store } = renderMount(
        '',
        <>
          <MountCounter />
          <ContextProbe />
        </>
      );
      expect(screen.getByTestId('probe-quickstarts')).toHaveTextContent('runtime-qs-a,runtime-qs-b');

      act(() => setRemoteState?.('loading'));
      expect(screen.getByTestId('probe-quickstarts')).toBeEmptyDOMElement();
      expect(store.get(quickstartsRuntimeContextAtom)).toBeNull();

      act(() => setRemoteState?.('ready'));
      expect(screen.getByTestId('probe-quickstarts')).toHaveTextContent('runtime-qs-a,runtime-qs-b');

      act(() => setRemoteState?.('failed'));
      expect(screen.getByTestId('probe-quickstarts')).toBeEmptyDOMElement();
      expect(screen.getByTestId('probe-topics')).toBeEmptyDOMElement();
      expect(store.get(quickstartsRuntimeContextAtom)).toBeNull();
      expect(store.get(degradedStateAtom).quickstarts).toBe(true);
      expect(mounts).toBe(1);
    });
  });
});
