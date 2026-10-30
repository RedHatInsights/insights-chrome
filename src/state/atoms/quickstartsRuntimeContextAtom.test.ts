import { createStore } from 'jotai';
import { HelpTopicContextDefaults, QuickStartContextDefaults } from '@patternfly/quickstarts';
import { quickstartsRuntimeContextAtom } from './quickstartsRuntimeContextAtom';

describe('quickstartsRuntimeContextAtom', () => {
  test('defaults to null', () => {
    const store = createStore();
    expect(store.get(quickstartsRuntimeContextAtom)).toBeNull();
  });

  test('stores and clears the runtime context values', () => {
    const store = createStore();
    const value = { quickStart: { ...QuickStartContextDefaults }, helpTopic: { ...HelpTopicContextDefaults } };

    store.set(quickstartsRuntimeContextAtom, value);
    expect(store.get(quickstartsRuntimeContextAtom)).toBe(value);

    store.set(quickstartsRuntimeContextAtom, null);
    expect(store.get(quickstartsRuntimeContextAtom)).toBeNull();
  });
});
