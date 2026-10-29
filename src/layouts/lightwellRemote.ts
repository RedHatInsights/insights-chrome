export type LightwellRemote = {
  scope: string;
  module: string;
  appId: string;
};

/** content-sources-frontend module mounted at /lightwell. */
export const CONTENT_SOURCES_LIGHTWELL_REMOTE: LightwellRemote = {
  scope: 'contentSources',
  module: './LightwellApp',
  appId: 'contentSources',
};

/**
 * lightwell-experience container, from insights.appname `lightwell-experience`.
 * Exposed module is `./RootApp`. Manifest: /apps/lightwell-experience/fed-mods.json.
 */
export const LIGHTWELL_EXPERIENCE_REMOTE: LightwellRemote = {
  scope: 'lightwellExperience',
  module: './RootApp',
  appId: 'lightwellExperience',
};
