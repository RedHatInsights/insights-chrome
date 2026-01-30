import { createStore } from 'jotai';

import { getDynamicSegmentItemsAtom, getNavigationSegmentAtom, navigationAtom, setNavigationSegmentAtom } from './navigationAtom';

describe('navigationAtom', () => {
  test('should highlight nav item', () => {
    const store = createStore();
    store.set(navigationAtom, {});
    store.set(setNavigationSegmentAtom, {
      segment: 'test',
      schema: { navItems: [{ title: 'test', href: '/test' }], sortedLinks: [] },
      pathname: '/test',
    });
    const navigation = store.get(navigationAtom);
    expect(navigation['test']).toBeTruthy();
    const navItem = navigation['test'].navItems[0];
    expect(navItem.active).toEqual(true);
  });

  test('should replace schema', () => {
    const store = createStore();
    store.set(navigationAtom, {});
    store.set(setNavigationSegmentAtom, {
      segment: 'test',
      schema: { navItems: [{ title: 'test', href: '/test' }], sortedLinks: [] },
      pathname: '/test',
    });
    let navigation = store.get(navigationAtom);
    expect(navigation['test']).toBeTruthy();
    expect(navigation['test'].navItems[0].title).toEqual('test');

    store.set(setNavigationSegmentAtom, {
      segment: 'test',
      schema: { navItems: [{ title: 'test2', href: '/test2' }], sortedLinks: [] },
      pathname: '/test2',
      shouldMerge: true,
    });
    navigation = store.get(navigationAtom);
    expect(navigation['test']).toBeTruthy();
    expect(navigation['test'].navItems[0].title).toEqual('test2');
  });

  test('should create new navigation sergment', () => {
    const schema = { navItems: [], sortedLinks: [] };
    const store = createStore();
    store.set(navigationAtom, {});
    store.set(setNavigationSegmentAtom, {
      segment: 'test',
      schema,
      pathname: '/test',
    });
    const navigation = store.get(navigationAtom);
    expect(navigation['test']).toBeTruthy();
    expect(navigation['test']).toEqual(schema);
  });

  test('should get navigation segment', () => {
    const store = createStore();
    store.set(navigationAtom, { test: { navItems: [{ title: 'test', href: '/test' }], sortedLinks: [] } });
    const segment = store.set(getNavigationSegmentAtom, 'test');
    expect(segment).toBeTruthy();
    expect(segment.navItems[0].title).toEqual('test');
  });

  test('should get dynamic segment items', () => {
    const store = createStore();
    store.set(navigationAtom, { test: { navItems: [{ title: 'foobar', href: '/test', dynamicNav: 'dynamic' }], sortedLinks: [] } });
    const items = store.set(getDynamicSegmentItemsAtom, 'test', 'dynamic');
    expect(items).toBeTruthy();
    expect(items[0].title).toEqual('foobar');
  });
});
