import { activeSectionComparator, globalNavComparator } from './comparators';

describe('comparators', () => {
  describe('globalNav', () => {
    const globalNav1 = [
      { title: 'Sources', module: 'sources#./RootApp', id: 'sources', active: false },
      {
        title: 'Integrations',
        module: { appName: 'integrations', scope: 'notifications', module: './RootApp', manifest: '/apps/notifications/fed-mods.json' },
        id: 'integrations',
        active: false,
      },
    ];
    const globalNav2 = [
      {
        title: 'My User Access',
        module: { appName: 'my-user-access', scope: 'rbac', module: './RootApp', manifest: '/apps/rbac/fed-mods.json' },
        id: 'my-user-access',
        default: true,
        active: false,
      },
      { title: 'Sources', module: 'sources#./RootApp', id: 'sources', active: false },
    ];

    it('same', () => {
      expect(globalNavComparator(globalNav1, globalNav1)).toEqual(true);
    });

    it('different', () => {
      expect(globalNavComparator(globalNav1, globalNav2)).toEqual(false);
    });
  });

  describe('activeSectionComparator', () => {
    it('same', () => {
      expect(activeSectionComparator({ id: 'sources' }, { id: 'sources' })).toEqual(true);
    });

    it('different', () => {
      expect(activeSectionComparator({ id: 'sources' }, { id: 'integrations' })).toEqual(false);
    });
  });
});
