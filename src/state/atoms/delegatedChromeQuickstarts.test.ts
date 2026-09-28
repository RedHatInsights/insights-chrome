import { QuickStart } from '@patternfly/quickstarts';
import {
  delegatedHelpTopicsAPI,
  delegatedQuickstartsAPI,
  dropPendingLiveChromeQuickstartsApis,
  publishLiveChromeQuickstartsApis,
  resetDelegatedChromeQuickstartsState,
} from './delegatedChromeQuickstarts';
import { liveHelpTopicsAPIRef, liveQuickstartsAPIRef } from './remoteQuickstartsAtom';

const stubQuickstart = { metadata: { name: 'qs-1' } } as QuickStart;

describe('delegatedChromeQuickstarts', () => {
  beforeEach(() => {
    resetDelegatedChromeQuickstartsState();
  });

  afterEach(() => {
    resetDelegatedChromeQuickstartsState();
  });

  it('replays activateQuickstart after the runtime becomes ready', async () => {
    const activateQuickstart = jest.fn().mockResolvedValue(undefined);
    const pending = delegatedQuickstartsAPI.activateQuickstart('insights-remediate-plan-create');

    expect(activateQuickstart).not.toHaveBeenCalled();

    publishLiveChromeQuickstartsApis({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart,
        toggle: jest.fn(),
        Catalog: jest.fn(),
        add: jest.fn(),
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics: jest.fn().mockResolvedValue([]),
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    await pending;
    expect(activateQuickstart).toHaveBeenCalledWith('insights-remediate-plan-create');
  });

  it('replays enableTopics after the runtime becomes ready', async () => {
    const enableTopics = jest.fn().mockResolvedValue([{ name: 'topic-a' }]);
    const pending = delegatedHelpTopicsAPI.enableTopics('topic-a');

    publishLiveChromeQuickstartsApis({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: jest.fn(),
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics,
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    await expect(pending).resolves.toEqual([{ name: 'topic-a' }]);
    expect(enableTopics).toHaveBeenCalledWith('topic-a');
  });

  it('does not hang activateQuickstart when the remote fails before ready', async () => {
    const pending = delegatedQuickstartsAPI.activateQuickstart('never-opens');
    dropPendingLiveChromeQuickstartsApis();
    await expect(pending).resolves.toBeUndefined();
    expect(liveQuickstartsAPIRef.current).toBeNull();
    expect(liveHelpTopicsAPIRef.current).toBeNull();
  });

  it('no-ops new calls after the remote has failed', async () => {
    dropPendingLiveChromeQuickstartsApis();
    await expect(delegatedQuickstartsAPI.activateQuickstart('too-late')).resolves.toBeUndefined();
    expect(delegatedQuickstartsAPI.add('app', stubQuickstart)).toBe(false);
    await expect(delegatedHelpTopicsAPI.enableTopics('topic-a')).resolves.toEqual([]);
  });

  it('forwards immediately once the live API is published', async () => {
    const activateQuickstart = jest.fn().mockResolvedValue(undefined);
    publishLiveChromeQuickstartsApis({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart,
        toggle: jest.fn(),
        Catalog: jest.fn(),
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics: jest.fn().mockResolvedValue([]),
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    await delegatedQuickstartsAPI.activateQuickstart('after-ready');
    expect(activateQuickstart).toHaveBeenCalledWith('after-ready');
  });
});
