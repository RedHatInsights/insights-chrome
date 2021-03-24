import { visibilityFunctions, isVisible } from '../consts';
import { load } from 'js-yaml';
import flatMap from 'lodash/flatMap';
import { getUrl, isBeta } from '../utils';
import flattenDeep from 'lodash/flattenDeep';

export let getNavFromConfig = async (masterConfig, active) => {
  return await Object.keys(masterConfig)
    .filter((appId) => (masterConfig[appId].top_level && appId === active) || !active)
    .reduce(async (acc, appId) => {
      const [routes, modules] = (await getAppData(appId, 'routes', masterConfig)) || [];
      return {
        ...(await acc),
        ...(routes && {
          [appId]: {
            ...routes,
            modules: [...((await acc)?.modules || []), ...modules],
          },
        }),
      };
    }, {});
};

const isCurrVisible = (permissions) =>
  Promise.all(
    flatMap(
      Array.isArray(permissions) ? permissions : [permissions],
      async ({ method, args } = {}) =>
        // (null, undefined, true) !== false
        (await visibilityFunctions?.[method]?.(...(args || []))) !== false
    )
  ).then((visibility) => visibility.every(Boolean));

export async function calculateVisibility({ permissions: appPermisions }, { permissions, id }, groupVisibility) {
  return isVisible([id], id, await isCurrVisible(permissions)) && isVisible(appPermisions && appPermisions.apps, id, groupVisibility);
}

// Returns a list of routes/subItems owned by an app
async function getRoutesForApp(app, masterConfig) {
  if (app?.frontend && app?.frontend?.sub_apps) {
    const visibility = await isCurrVisible(app.permissions);

    const [routes, modules] = (
      await Promise.all(
        app.frontend.sub_apps.map(async (subItem) => {
          if (await calculateVisibility(app, subItem, visibility)) {
            const [routes, modules] =
              (subItem.title
                ? [
                    {
                      id: subItem.id || '',
                      title: subItem.title,
                      ignoreCase: subItem.ignoreCase,
                      ...(subItem.section && { section: subItem.section }),
                      ...(subItem.sub_apps && { subItems: subItem.sub_apps }),
                      ...(subItem.navigate && { navigate: subItem.navigate }),
                    },
                  ]
                : await getAppData(subItem.id || subItem, 'subItems', masterConfig)) || [];
            return [
              {
                ...routes,
                ...(subItem.default && { default: subItem.default }),
                ...(subItem.group && { group: subItem.group }),
                ...(subItem.reload && { reload: subItem.reload }),
                ...(subItem.section && { section: subItem.section }),
                ...(subItem.navigate && { navigate: subItem.navigate }),
              },
              modules,
            ];
          }
        })
      )
    ).reduce(
      ([accRoutes, accModules] = [], [routes, modules] = []) => [
        [...(accRoutes || []), ...(routes ? [routes] : [])],
        [...(accModules || []), ...(modules ? [modules] : [])],
      ],
      []
    );

    return [routes.filter((subAppData) => subAppData?.title), modules];
  }

  return [];
}

// Gets the app's data from the master config, if it exists
async function getAppData(appId, propName, masterConfig) {
  const app = masterConfig[appId];
  if (app?.frontend) {
    if (app?.permissions && !app?.permissions?.apps) {
      if (!isVisible([appId], appId, await isCurrVisible(app.permissions))) {
        return;
      }
    }

    const [routes, modules] = await getRoutesForApp(app, masterConfig);

    if (routes?.length === 0 && app.frontend?.sub_apps) {
      return undefined;
    }

    const currModule = app?.frontend?.module;
    const appName = currModule?.appName || appId;

    return [
      {
        title: app.frontend.title || app.title,
        ignoreCase: app.ignoreCase,
        ...(currModule && { module: currModule }),
        ...(!app.frontend.suppress_id && { id: appId }),
        ...(app.frontend.reload && { reload: app.frontend.reload }),
        ...(routes?.length > 0 && { [propName]: routes }),
        ...(app.frontend.section && { section: app.frontend.section }),
        ...(app.navigate && { navigate: app.navigate }),
      },
      [
        ...(modules || []),
        ...(currModule
          ? [
              {
                [appName]: {
                  module: currModule,
                  name: appName,
                  manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}${currModule?.manifest || `/apps/${appName}/fed-mods.json`}`,
                },
              },
            ]
          : []),
      ],
    ];
  }
}

export async function loadNav(yamlConfig, cache) {
  const [active, section] = [getUrl('bundle') || 'insights', getUrl('app')];
  let activeBundle = await cache?.getItem(`navigation-${active}`);
  if (!activeBundle) {
    activeBundle = await getNavFromConfig(load(yamlConfig), active);
    cache?.setItem(`navigation-${active}`, activeBundle);
  }

  const globalNav = (activeBundle[active] || activeBundle.insights)?.routes;

  return {
    ...(activeBundle[active]
      ? {
          globalNav,
          activeTechnology: activeBundle[active].title,
          activeLocation: active,
          activeSection: globalNav?.find?.(({ id }) => id === section),
        }
      : {
          globalNav,
          activeTechnology: 'Applications',
        }),
    modules: flattenDeep((activeBundle[active] || activeBundle.insights)?.modules || []),
  };
}
