import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { HelpTopic, QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI } from '@redhat-cloud-services/types';
import {
  clearRegisteredChromeQuickstarts,
  delegatedHelpTopicsAPI,
  delegatedQuickstartsAPI,
  dropPendingLiveChromeQuickstartsApis,
  publishLiveChromeQuickstartsApis,
  resetDelegatedChromeQuickstartsState,
  retireLiveChromeQuickstartsApis,
} from './delegatedChromeQuickstarts';
import chromeStore from '../chromeStore';
import { activeModuleAtom } from './activeModuleAtom';
import { liveHelpTopicsAPIRef, liveQuickstartsAPIRef, liveQuickstartsCatalogAtom } from './remoteQuickstartsAtom';

const stubQuickstart = { metadata: { name: 'qs-1' } } as QuickStart;
/** `publish…` attaches the runtime in a microtask; let it run. */
const attached = () => Promise.resolve();

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

  it('settles new calls immediately after the remote has failed', async () => {
    dropPendingLiveChromeQuickstartsApis();
    await expect(delegatedQuickstartsAPI.activateQuickstart('too-late')).resolves.toBeUndefined();
    // Registrations are kept for a runtime that publishes later; the runtime validates `add` then.
    expect(delegatedQuickstartsAPI.add('app', stubQuickstart)).toBe(true);
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

  describe('runtime replacement', () => {
    const qsA = { metadata: { name: 'qs-a' } } as QuickStart;
    const qsB = { metadata: { name: 'qs-b' } } as QuickStart;

    const runtimeApis = (add: (key: string, qs: QuickStart) => boolean = () => true) => ({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: jest.fn(),
        add: jest.fn(add),
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

    it('detaches the live runtime and keeps queued calls on retire', async () => {
      const first = runtimeApis();
      publishLiveChromeQuickstartsApis(first);
      await attached();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).not.toBeNull();

      retireLiveChromeQuickstartsApis();
      expect(liveQuickstartsAPIRef.current).toBeNull();
      expect(liveHelpTopicsAPIRef.current).toBeNull();
      expect(chromeStore.get(liveQuickstartsCatalogAtom)).toBeNull();

      const pending = delegatedHelpTopicsAPI.setActiveTopic('topic-a');
      const second = runtimeApis();
      publishLiveChromeQuickstartsApis(second);
      await attached();

      await pending;
      expect(second.helpTopicsAPI.setActiveTopic).toHaveBeenCalledWith('topic-a');
      expect(first.helpTopicsAPI.setActiveTopic).not.toHaveBeenCalled();
    });

    it('queues again after a failed runtime is retired', async () => {
      dropPendingLiveChromeQuickstartsApis();
      retireLiveChromeQuickstartsApis();

      const pending = delegatedQuickstartsAPI.activateQuickstart('qs-a');
      expect(delegatedQuickstartsAPI.add('app', qsA)).toBe(true);
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      await pending;
      expect(next.quickstartsAPI.activateQuickstart).toHaveBeenCalledWith('qs-a');
      expect(next.quickstartsAPI.add).toHaveBeenCalledWith('app', qsA);
    });

    it('replays registrations into the replacement: set replaces, add appends', async () => {
      publishLiveChromeQuickstartsApis(runtimeApis());
      await attached();
      delegatedQuickstartsAPI.set('app', [qsB]);
      delegatedQuickstartsAPI.set('app', [qsA]);
      delegatedQuickstartsAPI.add('app', qsB);
      delegatedQuickstartsAPI.updateQuickStarts?.('other', [qsB]);

      retireLiveChromeQuickstartsApis();
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      expect(next.quickstartsAPI.set.mock.calls).toEqual([
        ['app', [qsA, qsB]],
        ['other', [qsB]],
      ]);
    });

    it('does not replay quickstarts the runtime rejected', async () => {
      publishLiveChromeQuickstartsApis(runtimeApis(() => false));
      await attached();
      expect(delegatedQuickstartsAPI.add('app', qsA)).toBe(false);

      retireLiveChromeQuickstartsApis();
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      expect(next.quickstartsAPI.set).not.toHaveBeenCalled();
    });

    it('replays only once per retire, not on every re-publish', async () => {
      const first = runtimeApis();
      publishLiveChromeQuickstartsApis(first);
      await attached();
      delegatedQuickstartsAPI.set('app', [qsA]);
      expect(first.quickstartsAPI.set).toHaveBeenCalledTimes(1);

      // Same runtime re-publishing (its API memo changed) must not duplicate registrations.
      publishLiveChromeQuickstartsApis(first);
      await attached();
      expect(first.quickstartsAPI.set).toHaveBeenCalledTimes(1);

      retireLiveChromeQuickstartsApis();
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();
      publishLiveChromeQuickstartsApis(next);
      await attached();
      expect(next.quickstartsAPI.set).toHaveBeenCalledTimes(1);
    });

    it('records queued registrations once they reach a runtime', async () => {
      delegatedQuickstartsAPI.set('app', [qsA]);
      publishLiveChromeQuickstartsApis(runtimeApis());
      await attached();

      retireLiveChromeQuickstartsApis();
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      expect(next.quickstartsAPI.set).toHaveBeenCalledWith('app', [qsA]);
    });

    it('drops the registry on module change', async () => {
      publishLiveChromeQuickstartsApis(runtimeApis());
      await attached();
      delegatedQuickstartsAPI.set('app', [qsA]);
      clearRegisteredChromeQuickstarts();

      retireLiveChromeQuickstartsApis();
      const next = runtimeApis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      expect(next.quickstartsAPI.set).not.toHaveBeenCalled();
    });

    describe('help topics', () => {
      const topic = (name: string) => ({ name, title: name, tags: [], content: name, links: [] }) as unknown as HelpTopic;
      const t1 = topic('topic-1');
      const t2 = topic('topic-2');
      const t3 = topic('topic-3');

      const replace = async () => {
        retireLiveChromeQuickstartsApis();
        const next = runtimeApis();
        publishLiveChromeQuickstartsApis(next);
        await attached();
        return next;
      };

      it('replays tenant-defined help topics with their enabled state into the replacement', async () => {
        publishLiveChromeQuickstartsApis(runtimeApis());
        await attached();
        delegatedHelpTopicsAPI.addHelpTopics([t1, t2]);
        delegatedHelpTopicsAPI.addHelpTopics([t3], false);
        delegatedHelpTopicsAPI.disableTopics('topic-2');
        await delegatedHelpTopicsAPI.enableTopics({ names: ['topic-3'], append: true });

        const next = await replace();

        expect(next.helpTopicsAPI.addHelpTopics.mock.calls).toEqual([
          [[t1, t3], true],
          [[t2], false],
        ]);
      });

      it('keeps help topics across module changes, like both runtimes', async () => {
        publishLiveChromeQuickstartsApis(runtimeApis());
        await attached();
        delegatedHelpTopicsAPI.addHelpTopics([t1]);
        clearRegisteredChromeQuickstarts();

        const next = await replace();

        expect(next.helpTopicsAPI.addHelpTopics).toHaveBeenCalledWith([t1], true);
      });

      it('replays help topics before queued help topic calls and keeps tracking them', async () => {
        publishLiveChromeQuickstartsApis(runtimeApis());
        await attached();
        delegatedHelpTopicsAPI.addHelpTopics([t1]);

        retireLiveChromeQuickstartsApis();
        delegatedHelpTopicsAPI.disableTopics('topic-1');
        const second = runtimeApis();
        const order: string[] = [];
        second.helpTopicsAPI.addHelpTopics.mockImplementation(() => order.push('replay'));
        second.helpTopicsAPI.disableTopics.mockImplementation(() => order.push('queued'));
        publishLiveChromeQuickstartsApis(second);
        await attached();
        expect(order).toEqual(['replay', 'queued']);

        const third = await replace();
        expect(third.helpTopicsAPI.addHelpTopics.mock.calls).toEqual([[[t1], false]]);
      });

      it('does not replay topics loaded by name, which the runtimes fetch on demand', async () => {
        publishLiveChromeQuickstartsApis(runtimeApis());
        await attached();
        await delegatedHelpTopicsAPI.enableTopics('api-topic');
        delegatedHelpTopicsAPI.disableTopics('api-topic');

        const next = await replace();

        expect(next.helpTopicsAPI.addHelpTopics).not.toHaveBeenCalled();
      });

      describe('filtered help topics (the topic switcher)', () => {
        const withEnabled = (resolve: (names: string[]) => HelpTopic[]) => {
          const runtime = runtimeApis();
          runtime.helpTopicsAPI.enableTopics.mockImplementation(async (...args: Parameters<ChromeAPI['helpTopics']['enableTopics']>) => {
            const [first] = args;
            return resolve(typeof first === 'object' ? first.names : (args as string[]));
          });
          return runtime;
        };
        const byName = (names: string[]) => names.map(topic);

        it('restores the switcher list after enableTopics with replace and append semantics', async () => {
          publishLiveChromeQuickstartsApis(withEnabled(byName));
          await attached();
          await delegatedHelpTopicsAPI.enableTopics('ignored');
          await delegatedHelpTopicsAPI.enableTopics('topic-1', 'topic-2');
          await delegatedHelpTopicsAPI.enableTopics({ names: ['topic-2', 'topic-3'], append: true });

          const next = await replace();
          await act(async () => {});

          // One topic per call keeps the switcher order: the runtimes list fetched topics first.
          expect(next.helpTopicsAPI.enableTopics.mock.calls).toEqual([
            ['topic-1'],
            [{ names: ['topic-2'], append: true }],
            [{ names: ['topic-3'], append: true }],
          ]);
        });

        it('restores the list after tenant topics are replayed, and drops disabled topics', async () => {
          publishLiveChromeQuickstartsApis(withEnabled(byName));
          await attached();
          delegatedHelpTopicsAPI.addHelpTopics([t1, t2]);
          await delegatedHelpTopicsAPI.enableTopics('topic-1', 'topic-2');
          delegatedHelpTopicsAPI.disableTopics('topic-1');

          retireLiveChromeQuickstartsApis();
          const next = runtimeApis();
          const order: string[] = [];
          next.helpTopicsAPI.addHelpTopics.mockImplementation(() => order.push('add'));
          next.helpTopicsAPI.enableTopics.mockImplementation(async () => {
            order.push('enable');
            return [];
          });
          publishLiveChromeQuickstartsApis(next);
          await attached();

          expect(order).toEqual(['add', 'add', 'enable']);
          expect(next.helpTopicsAPI.enableTopics).toHaveBeenCalledWith('topic-2');
        });

        it('tracks only the topics the runtime found', async () => {
          publishLiveChromeQuickstartsApis(withEnabled((names) => byName(names.filter((name) => name !== 'missing'))));
          await attached();
          await delegatedHelpTopicsAPI.enableTopics('topic-1', 'missing');

          const next = await replace();

          expect(next.helpTopicsAPI.enableTopics).toHaveBeenCalledWith('topic-1');
        });

        it('does not call enableTopics on the replacement when the switcher is empty', async () => {
          publishLiveChromeQuickstartsApis(runtimeApis());
          await attached();
          delegatedHelpTopicsAPI.addHelpTopics([t1]);

          const next = await replace();

          expect(next.helpTopicsAPI.enableTopics).not.toHaveBeenCalled();
        });
      });

      it('replays the latest version of a re-added topic', async () => {
        publishLiveChromeQuickstartsApis(runtimeApis());
        await attached();
        const updated = { ...t1, title: 'updated' } as HelpTopic;
        delegatedHelpTopicsAPI.addHelpTopics([t1], false);
        delegatedHelpTopicsAPI.addHelpTopics([updated]);

        const next = await replace();

        expect(next.helpTopicsAPI.addHelpTopics.mock.calls).toEqual([[[updated], true]]);
      });
    });
  });

  describe('registrations across a load timeout', () => {
    const topic = { name: 'tenant-topic', title: 'T', tags: [], content: 't', links: [] } as unknown as HelpTopic;
    const apis = () => ({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: jest.fn(),
        add: jest.fn(() => true),
        updateQuickStarts: jest.fn(),
      },
      helpTopicsAPI: {
        addHelpTopics: jest.fn(),
        disableTopics: jest.fn(),
        enableTopics: jest.fn().mockResolvedValue([topic]),
        setActiveTopic: jest.fn().mockResolvedValue(undefined),
        closeHelpTopic: jest.fn(),
      },
    });

    it('settles pending promises on timeout and applies registrations when the remote loads later', async () => {
      delegatedQuickstartsAPI.set('app', [stubQuickstart]);
      delegatedHelpTopicsAPI.addHelpTopics([topic], false);
      const enabled = delegatedHelpTopicsAPI.enableTopics('tenant-topic');
      const activated = delegatedQuickstartsAPI.activateQuickstart('qs-1');
      delegatedQuickstartsAPI.toggle('qs-1');

      dropPendingLiveChromeQuickstartsApis();
      await expect(enabled).resolves.toEqual([]);
      await expect(activated).resolves.toBeUndefined();
      // Made while degraded: tenants stay mounted, so these are not repeated either.
      expect(delegatedQuickstartsAPI.add('app', stubQuickstart)).toBe(true);
      delegatedHelpTopicsAPI.disableTopics('other-topic');

      const late = apis();
      publishLiveChromeQuickstartsApis(late);
      await attached();

      expect(late.quickstartsAPI.set).toHaveBeenCalledWith('app', [stubQuickstart]);
      expect(late.quickstartsAPI.add).toHaveBeenCalledWith('app', stubQuickstart);
      expect(late.helpTopicsAPI.addHelpTopics).toHaveBeenCalledWith([topic], false);
      expect(late.helpTopicsAPI.enableTopics).toHaveBeenCalledWith('tenant-topic');
      expect(late.helpTopicsAPI.disableTopics).toHaveBeenCalledWith('other-topic');
      // Transient UI actions are not replayed minutes later.
      expect(late.quickstartsAPI.activateQuickstart).not.toHaveBeenCalled();
      expect(late.quickstartsAPI.toggle).not.toHaveBeenCalled();
    });

    it('records registrations applied after a timeout for later runtime replacements', async () => {
      delegatedQuickstartsAPI.set('app', [stubQuickstart]);
      dropPendingLiveChromeQuickstartsApis();
      publishLiveChromeQuickstartsApis(apis());
      await attached();

      retireLiveChromeQuickstartsApis();
      const next = apis();
      publishLiveChromeQuickstartsApis(next);
      await attached();

      expect(next.quickstartsAPI.set).toHaveBeenCalledWith('app', [stubQuickstart]);
    });

    it('keeps applying queued calls when one of them throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      delegatedQuickstartsAPI.add('app', stubQuickstart);
      delegatedQuickstartsAPI.set('next', [stubQuickstart]);
      const late = apis();
      late.quickstartsAPI.add.mockImplementation(() => {
        throw new Error('rejected by validation');
      });
      publishLiveChromeQuickstartsApis(late);
      await attached();

      expect(late.quickstartsAPI.set).toHaveBeenCalledWith('next', [stubQuickstart]);
      expect(errorSpy).toHaveBeenCalledWith('Queued quickstarts call failed', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('applies each kept registration once, even after repeated failures', async () => {
      delegatedQuickstartsAPI.add('app', stubQuickstart);
      dropPendingLiveChromeQuickstartsApis();
      dropPendingLiveChromeQuickstartsApis();
      const late = apis();
      publishLiveChromeQuickstartsApis(late);
      await attached();
      publishLiveChromeQuickstartsApis(late);
      await attached();

      expect(late.quickstartsAPI.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('queued registrations on module change', () => {
    const qsA = { metadata: { name: 'qs-a' } } as QuickStart;
    const qsB = { metadata: { name: 'qs-b' } } as QuickStart;
    const apis = () => ({
      quickstartsAPI: {
        version: 1,
        set: jest.fn(),
        activateQuickstart: jest.fn().mockResolvedValue(undefined),
        toggle: jest.fn(),
        Catalog: jest.fn(),
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
    const topic = { name: 'tenant-topic', title: 'T', tags: [], content: 't', links: [] } as unknown as HelpTopic;

    afterEach(() => {
      chromeStore.set(activeModuleAtom, undefined);
    });

    it.each([
      ['while the remote loads', () => undefined],
      ['after a load timeout', () => dropPendingLiveChromeQuickstartsApis()],
    ])('discards quickstart registrations queued by a module the user left (%s)', async (_, fail) => {
      chromeStore.set(activeModuleAtom, 'first-app');
      delegatedQuickstartsAPI.set('first', [qsA]);
      delegatedQuickstartsAPI.add('first', qsA);
      delegatedQuickstartsAPI.updateQuickStarts?.('first-update', [qsA]);
      delegatedHelpTopicsAPI.addHelpTopics([topic]);
      fail();

      chromeStore.set(activeModuleAtom, 'second-app');
      delegatedQuickstartsAPI.set('second', [qsB]);
      clearRegisteredChromeQuickstarts('second-app');

      const runtime = apis();
      publishLiveChromeQuickstartsApis(runtime);
      await attached();

      expect(runtime.quickstartsAPI.set.mock.calls).toEqual([['second', [qsB]]]);
      expect(runtime.quickstartsAPI.add).not.toHaveBeenCalled();
      expect(runtime.quickstartsAPI.updateQuickStarts).not.toHaveBeenCalled();
      // Help topics are module-independent in both runtimes.
      expect(runtime.helpTopicsAPI.addHelpTopics).toHaveBeenCalledWith([topic]);
    });

    it('keeps registrations the new module queued before the module-change cleanup ran', async () => {
      chromeStore.set(activeModuleAtom, 'second-app');
      delegatedQuickstartsAPI.set('second', [qsB]);
      clearRegisteredChromeQuickstarts('second-app');

      const runtime = apis();
      publishLiveChromeQuickstartsApis(runtime);
      await attached();

      expect(runtime.quickstartsAPI.set).toHaveBeenCalledWith('second', [qsB]);
    });

    it('keeps queued non-registration calls on module change', async () => {
      chromeStore.set(activeModuleAtom, 'first-app');
      const pending = delegatedQuickstartsAPI.activateQuickstart('qs-a');
      chromeStore.set(activeModuleAtom, 'second-app');
      clearRegisteredChromeQuickstarts('second-app');

      const runtime = apis();
      publishLiveChromeQuickstartsApis(runtime);
      await attached();

      await pending;
      expect(runtime.quickstartsAPI.activateQuickstart).toHaveBeenCalledWith('qs-a');
    });
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
