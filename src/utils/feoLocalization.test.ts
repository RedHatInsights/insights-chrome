import cloneDeep from 'lodash/cloneDeep';
import { aliasSlug, localizeBundles, localizeNavItem, localizeServiceTiles, overlayField, overlayText } from './feoLocalization';
import bundles from '../../testdata/feo-localization/bundles.json';
import messages from '../../testdata/feo-localization/messages.fr.json';
import { BundleNavigation } from '../@types/types';
import { AllServicesSection } from '../components/AllServices/allServicesLinks';

describe('FEO locale overlays (operator shared fixtures)', () => {
  it.each([
    ['People', 'people'],
    ['a | b', 'a-b'],
    ['Équipe 日本語', 'quipe'],
    ['日本語', ''],
  ])('matches the operator alias slug for %s', (alias, expected) => {
    expect(aliasSlug(alias)).toBe(expected);
  });

  it('overlays a standalone stamped nav item but leaves legacy items and English source unchanged', () => {
    const stamped = { title: 'Users', href: '/iam/users', i18nKey: 'nav.rbac.iam.user-access.users' };
    expect(localizeNavItem(stamped, messages)).toEqual({ ...stamped, title: 'Utilisateurs' });
    const legacy = { title: 'Users', href: '/legacy' };
    expect(localizeNavItem(legacy, messages)).toEqual(legacy);
    expect(stamped.title).toBe('Users');
  });

  it('overlays individual fields using only nonblank own catalog keys', () => {
    expect(overlayField('Users', 'nav.rbac.iam.user-access.users.title', messages)).toBe('Utilisateurs');
    expect(overlayField('Users', undefined, messages)).toBe('Users');
    expect(overlayField('Users', 'title', { title: '  ' })).toBe('Users');
    expect(overlayField('Users', 'title', Object.create({ title: 'Inherited' }))).toBe('Users');
  });
  it('uses stamped IDs, including nested routes and navItems, without changing English or routing', () => {
    const english = cloneDeep(bundles) as BundleNavigation[];
    const snapshot = cloneDeep(english);
    const duplicate = {
      ...english[0].navItems[0],
      id: 'other-users',
      i18nKey: 'nav.other.users',
      permissions: { method: 'isOrgAdmin' as const, args: [] as [] },
    };
    english[0].navItems.push(duplicate);
    const localized = localizeBundles(english, { ...messages, 'nav.other.users.title': 'Autres utilisateurs', 'nav.other.users.href': '/evil' });
    expect(localized[0].title).toBe('Gestion des identités et des accès');
    expect(localized[0].description).toBe(snapshot[0].description);
    expect(localized[0].navItems[0].title).toBe('Utilisateurs');
    expect(localized[0].navItems.at(-1)).toEqual({ ...duplicate, title: 'Autres utilisateurs' });
    expect(localized[0].navItems[1].routes?.[1]).toMatchObject({ title: 'Rôles', product: 'Accès Red Hat', href: '/iam/user-access/roles' });
    expect(localized[0].navItems[2].navItems?.[0].title).toBe('Préférences');
    expect(localized[0].navItems[3].title).toBe('Espaces de travail');
    expect(english[0].navItems.slice(0, -1)).toEqual(snapshot[0].navItems);
    expect(localizeBundles(english, {})[0]).toEqual(english[0]);
  });

  it('localizes category/group labels and tiles, leaving legacy tiles and permissions unchanged', () => {
    const tile = {
      id: 'user-access',
      frontendRef: 'rbac',
      section: 'security',
      group: 'access',
      title: 'User Access',
      description: 'Manage access',
      href: '/iam/user-access',
    };
    const sections: AllServicesSection[] = [
      { id: 'security', title: 'Security', links: [{ id: 'access', title: 'Access', isGroup: true, links: [tile, { title: 'Legacy', href: '/legacy' }] }] },
    ];
    const snapshot = cloneDeep(sections);
    const localized = localizeServiceTiles(sections, messages);
    expect(localized[0]).toMatchObject({
      title: 'Sécurité',
      links: [
        {
          title: 'Accès',
          links: [
            { ...tile, title: 'Accès utilisateur', description: 'Gérer qui peut faire quoi' },
            { title: 'Legacy', href: '/legacy' },
          ],
        },
      ],
    });
    expect(sections).toEqual(snapshot);
  });

  it('localizes ungrouped tiles and preserves section identity for an empty catalog', () => {
    const tile = {
      id: 'user-access',
      frontendRef: 'rbac',
      section: 'security',
      group: 'access',
      title: 'User Access',
      description: 'Manage access',
      href: '/iam/user-access',
    };
    const sections: AllServicesSection[] = [{ id: 'security', title: 'Security', links: [tile] }];
    expect(localizeServiceTiles(sections, {})).toBe(sections);
    expect(localizeServiceTiles(sections, messages)[0].links[0]).toEqual({ ...tile, title: 'Accès utilisateur', description: 'Gérer qui peut faire quoi' });
    expect(sections[0].links[0]).toBe(tile);
    expect(tile.title).toBe('User Access');
  });

  it('ignores unknown keys, empty translations and non-text fields; supports module document title', () => {
    const base = { defaultDocumentTitle: 'User Access', href: '/iam' };
    expect(overlayText(base, 'module.rbac', ['defaultDocumentTitle'], messages)).toEqual({ ...base, defaultDocumentTitle: 'Accès utilisateur' });
    expect(overlayText(base, 'module.rbac', ['defaultDocumentTitle'], { 'module.rbac.defaultDocumentTitle': '   ', 'module.rbac.href': '/evil' })).toBe(base);
  });
});
