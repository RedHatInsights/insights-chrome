import React, { useContext } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { HelpTopic, HelpTopicContext } from '@patternfly/quickstarts';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ScalprumComponent } from '@scalprum/react-core';
import { ChromeAPI } from '@redhat-cloud-services/types';
import axios from 'axios';
import QuickstartsRuntimeMount from './QuickstartsRuntimeMount';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { LiveQuickstartsAPI } from '../../state/atoms/remoteQuickstartsAtom';
import { delegatedHelpTopicsAPI, resetDelegatedChromeQuickstartsState } from '../../state/atoms/delegatedChromeQuickstarts';

/** Swaps against the real legacy runtime; QuickstartsRuntimeMount.test.tsx covers the mount with a mocked one. */

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: jest.fn(({ children }: { children?: React.ReactNode }) => <div data-testid="remote-runtime">{children}</div>),
}));

jest.mock('axios');

type RuntimeApis = { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] };

const mockedUseFlag = useFlag as jest.Mock;
const MockedScalprumComponent = ScalprumComponent as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

const topic = (name: string) => ({ name, title: name, tags: [], content: name, links: [] }) as unknown as HelpTopic;
const apiTopic = topic('api-topic');

const remoteApis = (): RuntimeApis => ({
  quickstartsAPI: {
    version: 1,
    set: jest.fn(),
    activateQuickstart: jest.fn().mockResolvedValue(undefined),
    toggle: jest.fn(),
    Catalog: () => null,
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

/** What the help-topic panel's topic switcher renders from. */
const TopicSwitcher = () => {
  const { filteredHelpTopics = [] } = useContext(HelpTopicContext);
  return <span data-testid="switcher">{filteredHelpTopics.map(({ name }) => name).join(',')}</span>;
};

const renderMount = () => {
  const store = createStore();
  store.set(activeModuleAtom, 'insights');
  const tree = () => (
    <JotaiProvider store={store}>
      <ChromeAuthContext.Provider value={{ user: { identity: { internal: { account_id: '123' } } } } as never}>
        <QuickstartsRuntimeMount>
          <TopicSwitcher />
        </QuickstartsRuntimeMount>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  const result = render(tree());
  return { rerenderMount: () => result.rerender(tree()) };
};

const settle = () => act(async () => {});
const switcher = () => screen.getByTestId('switcher').textContent;

describe('QuickstartsRuntimeMount with the real legacy runtime', () => {
  beforeEach(() => {
    resetDelegatedChromeQuickstartsState();
    mockedUseFlag.mockReturnValue(false);
    mockedAxios.get.mockImplementation(async (url: string) =>
      url.includes('/helptopics') && url.includes('api-topic') ? { data: [{ content: apiTopic }] } : { data: { data: [] } }
    );
    mockedAxios.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    resetDelegatedChromeQuickstartsState();
  });

  it('restores the help-topic switcher after switching to the remote and back', async () => {
    const { rerenderMount } = renderMount();
    await settle();
    delegatedHelpTopicsAPI.addHelpTopics([topic('tenant-a'), topic('tenant-b')]);
    await settle();
    await act(() => delegatedHelpTopicsAPI.enableTopics('tenant-a', 'tenant-b'));
    await act(() => delegatedHelpTopicsAPI.enableTopics({ names: ['api-topic'], append: true }));
    expect(switcher()).toBe('tenant-a,tenant-b,api-topic');

    mockedUseFlag.mockReturnValue(true);
    rerenderMount();
    const remote = remoteApis();
    await act(async () => {
      MockedScalprumComponent.mock.calls[MockedScalprumComponent.mock.calls.length - 1][0].onApiReady(remote);
    });
    await waitFor(() => expect(remote.helpTopicsAPI.enableTopics).toHaveBeenCalledTimes(3));
    expect(remote.helpTopicsAPI.enableTopics).toHaveBeenNthCalledWith(1, 'tenant-a');

    mockedUseFlag.mockReturnValue(false);
    rerenderMount();
    // The fresh legacy runtime resolves tenant topics replayed in the same tick and refetches the API topic.
    await waitFor(() => expect(switcher()).toBe('tenant-a,tenant-b,api-topic'));
  });

  it('keeps disableTopics and replace semantics across the switch', async () => {
    const { rerenderMount } = renderMount();
    await settle();
    delegatedHelpTopicsAPI.addHelpTopics([topic('tenant-a'), topic('tenant-b'), topic('tenant-c')]);
    await settle();
    await act(() => delegatedHelpTopicsAPI.enableTopics('tenant-a', 'tenant-b'));
    await act(() => delegatedHelpTopicsAPI.enableTopics('tenant-b', 'tenant-c'));
    act(() => delegatedHelpTopicsAPI.disableTopics('tenant-c'));
    expect(switcher()).toBe('tenant-b');

    mockedUseFlag.mockReturnValue(true);
    rerenderMount();
    await act(async () => {
      MockedScalprumComponent.mock.calls[MockedScalprumComponent.mock.calls.length - 1][0].onApiReady(remoteApis());
    });
    mockedUseFlag.mockReturnValue(false);
    rerenderMount();

    await waitFor(() => expect(switcher()).toBe('tenant-b'));
  });
});
