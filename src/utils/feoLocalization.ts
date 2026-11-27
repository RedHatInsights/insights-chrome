import { NavItem } from '../@types/types';
import { AllServicesLink, AllServicesSection, isAllServicesGroup } from '../components/AllServices/allServicesLinks';
import type { SearchEntry } from '@redhat-cloud-services/types';

export type FeoMessages = Readonly<Record<string, string>>;

// Runtime key contract: frontend-operator/controllers/locale_keys.go.
const keys = {
  bundle: (id: string) => `bundle.${id}`,
  search: (id: string) => `search.${id}`,
  module: (id: string) => `module.${id}`,
  category: (id: string) => `serviceCategory.${id}`,
  group: (category: string, group: string) => `serviceCategory.${category}.group.${group}`,
  tile: (tile: AllServicesLink) => (tile.frontendRef && tile.id ? `tile.${tile.frontendRef}.${tile.section}.${tile.group}.${tile.id}` : undefined),
};

export function overlayField(english: string, key: string | undefined, messages: FeoMessages): string {
  const translated = key && Object.hasOwn(messages, key) ? messages[key] : undefined;
  return typeof translated === 'string' && translated.trim() ? translated : english;
}

// Only text fields are eligible. Catalogs must never change routes or permissions.
export function overlayText<T extends object>(value: T, prefix: string | undefined, fields: readonly string[], messages: FeoMessages): T {
  if (!prefix) return value;
  const translated: Record<string, string> = {};
  for (const field of fields) {
    const original = (value as Record<string, unknown>)[field];
    const localized = overlayField(typeof original === 'string' ? original : '', `${prefix}.${field}`, messages);
    if (localized && localized !== original) translated[field] = localized;
  }
  return Object.keys(translated).length ? { ...value, ...translated } : value;
}

export function localizeBundleTitle(title: string, id: string, messages: FeoMessages): string {
  return overlayField(title, `${keys.bundle(id)}.title`, messages);
}

export function localizeModuleTitle(title: string, id: string, messages: FeoMessages): string {
  return overlayField(title, `${keys.module(id)}.defaultDocumentTitle`, messages);
}

export function localizeNavItem(item: NavItem, messages: FeoMessages): NavItem {
  return {
    ...overlayText(item, item.i18nKey, ['title', 'product'], messages),
    ...(item.navItems ? { navItems: item.navItems.map((child) => localizeNavItem(child, messages)) } : {}),
    ...(item.routes ? { routes: item.routes.map((child) => localizeNavItem(child, messages)) } : {}),
  };
}

export function localizeBundles<T extends { id?: string; title?: string; navItems: NavItem[] }>(bundles: T[], messages: FeoMessages): T[] {
  if (!Object.keys(messages).length) return bundles;
  return bundles.map((bundle) => ({
    ...overlayText(bundle, bundle.id ? keys.bundle(bundle.id) : undefined, ['title', 'description'], messages),
    navItems: bundle.navItems.map((item) => localizeNavItem(item, messages)),
  }));
}

function localizeTile(tile: AllServicesLink, messages: FeoMessages): AllServicesLink {
  return overlayText(tile, keys.tile(tile), ['title', 'description'], messages);
}

export function localizeServiceTiles(sections: AllServicesSection[], messages: FeoMessages): AllServicesSection[] {
  if (!Object.keys(messages).length) return sections;
  return sections.map((section) => ({
    ...overlayText(section, section.id ? keys.category(section.id) : undefined, ['title'], messages),
    links: section.links.map((link) =>
      isAllServicesGroup(link)
        ? {
            ...overlayText(link, section.id && link.id ? keys.group(section.id, link.id) : undefined, ['title'], messages),
            links: link.links.map((tile) => localizeTile(tile, messages)),
          }
        : localizeTile(link, messages)
    ),
  }));
}

// Must match aliasSlug in frontend-operator/controllers/locale_keys.go.
export const aliasSlug = (alias: string) =>
  alias
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function localizeSearchEntry(entry: SearchEntry, bundleId: string | undefined, messages: FeoMessages): SearchEntry {
  const prefix = keys.search(entry.id);
  const translated = overlayText(entry, prefix, ['title', 'description'], messages);
  const aliases = (entry.altTitle ?? []).map((alias) => {
    const slug = aliasSlug(alias);
    return slug ? overlayField(alias, `${prefix}.alt_title.${slug}`, messages) : alias;
  });
  const textChanged = translated !== entry || aliases.some((alias, i) => alias !== entry.altTitle?.[i]);
  const bundleTitle = bundleId ? localizeBundleTitle(entry.bundleTitle, bundleId, messages) : entry.bundleTitle;
  if (!textChanged && bundleTitle === entry.bundleTitle) return entry;
  return {
    ...translated,
    bundleTitle,
    // Preserve the exact English index when no search text was translated.
    altTitle: textChanged ? [...new Set([...aliases, ...(entry.altTitle ?? []), entry.title, entry.description])] : entry.altTitle,
  };
}
