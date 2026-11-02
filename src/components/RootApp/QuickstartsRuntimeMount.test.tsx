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
import { ChromeAPI } from '@redhat-cloud-services/types';
import QuickstartsRuntimeMount, {
  LEARNING_RESOURCES_QUICKSTARTS_FLAG,
  LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY,
  REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS,
} from './QuickstartsRuntimeMount';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { LiveQuickstartsAPI, liveQuickstartsAPIRef, liveQuickstartsCatalogAtom, remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';
import { delegatedQuickstartsAPI, resetDelegatedChromeQuickstartsState } from '../../state/atoms/delegatedChromeQuickstarts';
import chromeStore from '../../state/chromeStore';
import { quickstartsRuntimeContextAtom } from '../../state/atoms/quickstartsRuntimeContextAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: jest.fn(({ children }: { children?: React.ReactNode }) => <div data-testid="remote-runtime">{children}</div>),
}));

type RuntimeApis = { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] };

/** When set, the legacy mock publishes these from a passive effect, like the real `ApiPublisher`. */
let mockLegacyApis: RuntimeApis | undefined;

jest.mock('./LegacyQuickstartsRuntime', () => ({
  __esModule: true,
  default: ({ children, onApiReady }: { children?: React.ReactNode; onApiReady?: (api: RuntimeApis) => void }) => {
    const { useEffect } = jest.requireActual<typeof React>('react');
    useEffect(() => {
      if (mockLegacyApis) {
        onApiReady?.(mockLegacyApis);
      }
    }, [onApiReady]);
    return <div data-testid="legacy-runtime">{children}</div>;
  },
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
  const tree = () => (
    <JotaiProvider store={store}>
      <ChromeAuthContext.Provider value={chromeAuth as never}>
        <QuickstartsRuntimeMount>{children}</QuickstartsRuntimeMount>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  const result = render(tree());
  return {
    store,
    ...result,
    /** Re-render with the same children, e.g. after changing the mocked flag. */
    rerenderMount: () => result.rerender(tree()),
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
    mockLegacyApis = undefined;
    jest.useRealTimers();
    window.localStorage.removeItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY);
    resetDelegatedChromeQuickstartsState();
    MockedScalprumComponent.mockImplementation(({ children }: { children?: React.ReactNode }) => <div data-testid="remote-runtime">{children}</div>);
  });

  it('uses leftover Chrome providers when the flag is off', () => {
    const { store } = renderMount();

    expect(screen.getByTestId('legacy-runtime')).toHaveTextContent('shell-child');
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

  describe('runtime flag changes', () => {
    const qsA = { metadata: { name: 'qs-a' } } as QuickStart;
    const qsB = { metadata: { name: 'qs-b' } } as QuickStart;
    const qsC = { metadata: { name: 'qs-c' } } as QuickStart;

    const createApis = (label: string): RuntimeApis => ({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: Object.assign(() => <span>{label}-catalog</span>, { displayName: `${label}Catalog` }),
        add: jest.fn(() => true),
        updateQuickStarts: jest.fn(),
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics: jest.fn().mockResolvedValue([]),
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    const publishRemote = async (apis: RuntimeApis) => {
      const props = MockedScalprumComponent.mock.calls[MockedScalprumComponent.mock.calls.length - 1][0];
      await act(async () => {
        props.onApiReady(apis);
      });
    };

    /** Let effects and the deferred runtime attach run. */
    const settle = () => act(async () => {});

    const TenantForm = ({ onMount }: { onMount: () => void }) => {
      const [value, setValue] = React.useState('');
      React.useLayoutEffect(() => {
        onMount();
      }, []);
      return <input aria-label="tenant-input" value={value} onChange={(event) => setValue(event.target.value)} />;
    };

    it.each([false, true])('does not time out when the remote publishes during its first effect pass (initial remote: %s)', (initiallyRemote) => {
      const remote = createApis('remote');
      MockedScalprumComponent.mockImplementation(({ children, onApiReady }: { children?: React.ReactNode; onApiReady: (api: RuntimeApis) => void }) => {
        React.useEffect(() => {
          onApiReady(remote);
        }, [onApiReady]);
        return <div data-testid="remote-runtime">{children}</div>;
      });
      jest.useFakeTimers();
      mockedUseFlag.mockReturnValue(initiallyRemote);
      const { store, rerenderMount } = renderMount();

      if (!initiallyRemote) {
        mockedUseFlag.mockReturnValue(true);
        rerenderMount();
      }
      expect(store.get(degradedStateAtom).quickstarts).toBe(false);
      act(() => {
        jest.advanceTimersByTime(REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
      });

      expect(store.get(degradedStateAtom).quickstarts).toBe(false);
      expect(liveQuickstartsAPIRef.current).toBe(remote.quickstartsAPI);
    });

    it('times out a replacement that never publishes even when the outgoing runtime was ready', () => {
      const legacy = createApis('legacy');
      mockLegacyApis = legacy;
      jest.useFakeTimers();
      const { store, rerenderMount } = renderMount();
      act(() => jest.runAllTicks());
      expect(liveQuickstartsAPIRef.current).toBe(legacy.quickstartsAPI);

      mockedUseFlag.mockReturnValue(true);
      rerenderMount();
      act(() => jest.advanceTimersByTime(REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS));

      expect(store.get(degradedStateAtom).quickstarts).toBe(true);
      expect(liveQuickstartsAPIRef.current).toBeNull();
    });

    it('keeps tenant state when the flag changes in either direction', () => {
      let mounts = 0;
      const { rerenderMount } = renderMount('', <TenantForm onMount={() => (mounts += 1)} />);
      fireEvent.change(screen.getByLabelText('tenant-input'), { target: { value: 'unsaved draft' } });
      expect(screen.getByTestId('legacy-runtime')).toContainElement(screen.getByLabelText('tenant-input'));

      mockedUseFlag.mockReturnValue(true);
      rerenderMount();
      expect(screen.queryByTestId('legacy-runtime')).not.toBeInTheDocument();
      expect(screen.getByTestId('remote-runtime')).toContainElement(screen.getByLabelText('tenant-input'));
      expect(screen.getByLabelText('tenant-input')).toHaveValue('unsaved draft');

      mockedUseFlag.mockReturnValue(false);
      rerenderMount();
      expect(screen.queryByTestId('remote-runtime')).not.toBeInTheDocument();
      expect(screen.getByTestId('legacy-runtime')).toContainElement(screen.getByLabelText('tenant-input'));
      expect(screen.getByLabelText('tenant-input')).toHaveValue('unsaved draft');
      expect(mounts).toBe(1);
    });

    it('detaches the old runtime on switch and queues calls for the replacement', async () => {
      const legacy = createApis('legacy');
      const remote = createApis('remote');
      mockLegacyApis = legacy;
      const { rerenderMount } = renderMount();
      await settle();
      expect(liveQuickstartsAPIRef.current).toBe(legacy.quickstartsAPI);

      mockedUseFlag.mockReturnValue(true);
      rerenderMount();
      expect(liveQuickstartsAPIRef.current).toBeNull();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).toBeNull();

      delegatedQuickstartsAPI.set('app', [qsC]);
      void delegatedQuickstartsAPI.activateQuickstart('qs-c');
      expect(legacy.quickstartsAPI.set).not.toHaveBeenCalled();
      expect(legacy.quickstartsAPI.activateQuickstart).not.toHaveBeenCalled();

      await publishRemote(remote);
      expect(remote.quickstartsAPI.set).toHaveBeenCalledWith('app', [qsC]);
      expect(remote.quickstartsAPI.activateQuickstart).toHaveBeenCalledWith('qs-c');
      expect(chromeStore.get(liveQuickstartsCatalogAtom)?.Catalog).toBe(remote.quickstartsAPI.Catalog);
    });

    it('replays tenant registrations into the replacement before queued calls', async () => {
      const legacy = createApis('legacy');
      const remote = createApis('remote');
      mockLegacyApis = legacy;
      const { rerenderMount } = renderMount();
      await settle();
      delegatedQuickstartsAPI.set('app', [qsA]);
      delegatedQuickstartsAPI.add('app', qsB);

      mockedUseFlag.mockReturnValue(true);
      rerenderMount();
      delegatedQuickstartsAPI.set('other', [qsC]);
      await publishRemote(remote);

      expect((remote.quickstartsAPI.set as jest.Mock).mock.calls).toEqual([
        ['app', [qsA, qsB]],
        ['other', [qsC]],
      ]);
    });

    it('does not replay registrations from a previous module', async () => {
      const legacy = createApis('legacy');
      const remote = createApis('remote');
      mockLegacyApis = legacy;
      const { store, rerenderMount } = renderMount();
      await settle();
      delegatedQuickstartsAPI.set('app', [qsA]);
      act(() => {
        store.set(activeModuleAtom, 'other-module');
      });

      mockedUseFlag.mockReturnValue(true);
      rerenderMount();
      await publishRemote(remote);

      expect(remote.quickstartsAPI.set).not.toHaveBeenCalled();
    });

    it('replays into a replacement that clears its quickstarts on mount, like both real runtimes', async () => {
      const legacy = createApis('legacy');
      mockLegacyApis = legacy;
      const { rerenderMount } = renderMount();
      await settle();
      delegatedQuickstartsAPI.set('app', [qsA]);

      // Real runtimes publish from a child effect, then clear their store from a parent mount
      // effect, which runs after it. Anything applied during the publish itself is wiped.
      const store = new Map<string, QuickStart[]>();
      const remote = createApis('remote');
      (remote.quickstartsAPI.set as jest.Mock).mockImplementation((key: string, qs: QuickStart[]) => store.set(key, qs));
      const Publisher = ({ onApiReady }: { onApiReady: (api: RuntimeApis) => void }) => {
        React.useEffect(() => {
          onApiReady(remote);
        }, [onApiReady]);
        return null;
      };
      MockedScalprumComponent.mockImplementation(({ children, onApiReady }: { children?: React.ReactNode; onApiReady: (api: RuntimeApis) => void }) => {
        React.useEffect(() => {
          store.clear();
        }, []);
        return (
          <div data-testid="remote-runtime">
            <Publisher onApiReady={onApiReady} />
            {children}
          </div>
        );
      });

      mockedUseFlag.mockReturnValue(true);
      delegatedQuickstartsAPI.set('queued', [qsC]);
      await act(async () => {
        rerenderMount();
      });

      expect(Object.fromEntries(store)).toEqual({ app: [qsA], queued: [qsC] });
    });

    it('keeps the legacy API published in the same commit as the switch from remote', async () => {
      const legacy = createApis('legacy');
      const remote = createApis('remote');
      mockedUseFlag.mockReturnValue(true);
      const { rerenderMount } = renderMount();
      await publishRemote(remote);
      expect(liveQuickstartsAPIRef.current).toBe(remote.quickstartsAPI);

      mockLegacyApis = legacy;
      mockedUseFlag.mockReturnValue(false);
      rerenderMount();
      await settle();

      expect(liveQuickstartsAPIRef.current).toBe(legacy.quickstartsAPI);
      delegatedQuickstartsAPI.toggle('qs-a');
      expect(legacy.quickstartsAPI.toggle).toHaveBeenCalledWith('qs-a');
      expect(remote.quickstartsAPI.toggle).not.toHaveBeenCalled();
    });

    it('queues instead of dropping calls after switching away from a failed remote', async () => {
      const legacy = createApis('legacy');
      mockedUseFlag.mockReturnValue(true);
      jest.useFakeTimers();
      const { store, rerenderMount } = renderMount();
      act(() => {
        jest.advanceTimersByTime(REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
      });
      expect(store.get(degradedStateAtom).quickstarts).toBe(true);
      // Fake timers also fake queueMicrotask, which the runtime attach uses.
      jest.useRealTimers();

      mockedUseFlag.mockReturnValue(false);
      rerenderMount();
      const pending = delegatedQuickstartsAPI.activateQuickstart('qs-a');
      // Same `handleApiReady` the legacy runtime receives; publish late to observe the queue.
      const { onApiReady } = MockedScalprumComponent.mock.calls[0][0];
      await act(async () => {
        onApiReady(legacy);
      });

      await pending;
      expect(legacy.quickstartsAPI.activateQuickstart).toHaveBeenCalledWith('qs-a');
      expect(store.get(degradedStateAtom).quickstarts).toBe(false);
    });
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
