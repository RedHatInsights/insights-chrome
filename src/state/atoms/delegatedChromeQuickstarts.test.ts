import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI } from '@redhat-cloud-services/types';
import {
  delegatedHelpTopicsAPI,
  delegatedQuickstartsAPI,
  dropPendingLiveChromeQuickstartsApis,
  publishLiveChromeQuickstartsApis,
  resetDelegatedChromeQuickstartsState,
} from './delegatedChromeQuickstarts';
import chromeStore from '../chromeStore';
import { liveHelpTopicsAPIRef, liveQuickstartsAPIRef, liveQuickstartsCatalogAtom } from './remoteQuickstartsAtom';

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

  describe('Catalog', () => {
    const StubCatalog = (props: { title?: string }) => React.createElement('div', { 'data-testid': 'live-catalog' }, props.title);

    const liveApis = (Catalog: unknown = StubCatalog) => ({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: Catalog as ChromeAPI['quickStarts']['Catalog'],
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics: jest.fn().mockResolvedValue([]),
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    /** Renders the delegate once; any later render can only come from the delegate's own subscription. */
    const renderTenantCatalog = () => {
      let parentRenders = 0;
      const Tenant = () => {
        parentRenders += 1;
        return React.createElement(delegatedQuickstartsAPI.Catalog as React.ComponentType<{ title: string }>, { title: 'Tenant catalog' });
      };
      render(React.createElement(Tenant));
      return { getParentRenders: () => parentRenders };
    };

    it('renders nothing before the runtime publishes', () => {
      renderTenantCatalog();
      expect(screen.queryByTestId('live-catalog')).not.toBeInTheDocument();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).toBeNull();
    });

    it('renders an already-mounted catalog when the runtime publishes, without a parent re-render', () => {
      const { getParentRenders } = renderTenantCatalog();
      expect(screen.queryByTestId('live-catalog')).not.toBeInTheDocument();

      act(() => {
        publishLiveChromeQuickstartsApis(liveApis());
      });

      expect(screen.getByTestId('live-catalog')).toHaveTextContent('Tenant catalog');
      expect(getParentRenders()).toBe(1);
    });

    it('removes the catalog when the remote fails and restores it on re-publish', () => {
      renderTenantCatalog();
      act(() => {
        publishLiveChromeQuickstartsApis(liveApis());
      });
      expect(screen.getByTestId('live-catalog')).toBeInTheDocument();

      act(() => {
        dropPendingLiveChromeQuickstartsApis();
      });
      expect(screen.queryByTestId('live-catalog')).not.toBeInTheDocument();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).toBeNull();

      act(() => {
        publishLiveChromeQuickstartsApis(liveApis());
      });
      expect(screen.getByTestId('live-catalog')).toBeInTheDocument();
    });

    it('clears the published catalog on reset', () => {
      publishLiveChromeQuickstartsApis(liveApis());
      expect(chromeStore.get(liveQuickstartsCatalogAtom)?.Catalog).toBe(StubCatalog);

      resetDelegatedChromeQuickstartsState();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).toBeNull();
    });

    it('renders nothing if the published API has no Catalog', () => {
      renderTenantCatalog();
      act(() => {
        publishLiveChromeQuickstartsApis(liveApis(null));
      });
      expect(screen.queryByTestId('live-catalog')).not.toBeInTheDocument();
    });
  });
});
