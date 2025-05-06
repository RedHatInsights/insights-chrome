import { createStore } from 'jotai';
import { addQuickstartToAppAtom, clearQuickstartsAtom, populateQuickstartsAppAtom, quickstartsAtom } from './quickstartsAtom';
import { QuickStart } from '@patternfly/quickstarts';

const dummyQuickstart: QuickStart = {
  metadata: {
    name: 'dummy',
  },
  spec: {
    displayName: 'Foo',
    description: 'bar',
    icon: '',
  },
};

describe('quickstartsAtom', () => {
  test('should add new quickstart to existing app', () => {
    const store = createStore();
    store.set(quickstartsAtom, { foo: [] });
    store.set(addQuickstartToAppAtom, { app: 'foo', quickstart: { ...dummyQuickstart } });

    const { foo } = store.get(quickstartsAtom);
    expect(foo).toHaveLength(1);
    expect(foo[0].metadata.name).toBe('dummy');
  });

  test('should append new quickstart to existing app', () => {
    const store = createStore();
    store.set(quickstartsAtom, { foo: [{ ...dummyQuickstart }] });
    store.set(addQuickstartToAppAtom, { app: 'foo', quickstart: { ...dummyQuickstart, metadata: { name: 'dummy2' } } });

    const { foo } = store.get(quickstartsAtom);
    expect(foo).toHaveLength(2);
    expect(foo[1].metadata.name).toBe('dummy2');
  });

  test('should populate new app with quickstarts', () => {
    const store = createStore();
    store.set(quickstartsAtom, {});
    store.set(populateQuickstartsAppAtom, { app: 'foo', quickstarts: [{ ...dummyQuickstart }] });

    const { foo } = store.get(quickstartsAtom);
    expect(foo).toHaveLength(1);
    expect(foo[0].metadata.name).toBe('dummy');
  });

  test('should clear all quickstarts', () => {
    const store = createStore();
    store.set(quickstartsAtom, {
      bar: [{ ...dummyQuickstart, metadata: { name: 'active' } }],
      baz: [{ ...dummyQuickstart, metadata: { name: 'bla' } }],
      foo: [{ ...dummyQuickstart }],
    });

    store.set(clearQuickstartsAtom);
    const quickstarts = store.get(quickstartsAtom);
    expect(quickstarts).toEqual({});
  });

  test('should clear all quickstarts except active', () => {
    const store = createStore();
    store.set(quickstartsAtom, {
      bar: [{ ...dummyQuickstart, metadata: { name: 'active' } }],
      baz: [{ ...dummyQuickstart, metadata: { name: 'bla' } }],
      foo: [{ ...dummyQuickstart }],
    });

    store.set(clearQuickstartsAtom, 'active');

    const quickstarts = store.get(quickstartsAtom);
    expect(quickstarts).toEqual({ bar: [{ ...dummyQuickstart, metadata: { name: 'active' } }] });
  });
});
