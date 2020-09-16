import { visibilityFunctions, isVisible } from '../consts';
import { safeLoad } from 'js-yaml';
import flatMap from 'lodash/flatMap';
import { getUrl } from '../utils';

export let getNavFromConfig = async (masterConfig) => {
    return await Object.keys(masterConfig).filter(appId => masterConfig[appId].top_level).reduce(async (acc, appId) => {
        const routes = await getAppData(appId, 'routes', masterConfig);
        return {
            ...await acc,
            ...routes && { [appId]: routes }
        };
    }, {});
};

const isCurrVisible = (permissions) => Promise.all(
    flatMap([permissions], async ({ method, args } = {}) => (
        // (null, undefined, true) !== false
        await visibilityFunctions?.[method]?.(...args || []) !== false
    ))
).then(visibility => visibility.every(Boolean));

export async function calculateVisibility({ permissions: appPermisions }, { permissions, id }, groupVisibility) {
    return (
        isVisible([id], id, await isCurrVisible(permissions)) &&
        isVisible(appPermisions && appPermisions.apps, id, groupVisibility)
    );
}

// Returns a list of routes/subItems owned by an app
async function getRoutesForApp(app, masterConfig) {
    if (app?.frontend && app?.frontend?.sub_apps) {
        const visibility = await isCurrVisible(app.permissions);

        const routes = await Promise.all(app.frontend.sub_apps.map(async subItem => {
            return (await calculateVisibility(app, subItem, visibility)) && ({
                ...subItem.title ? {
                    id: subItem.id || '',
                    title: subItem.title,
                    ignoreCase: subItem.ignoreCase
                } : await getAppData(subItem.id || subItem, 'subItems', masterConfig),
                ...subItem.default && { default: subItem.default },
                ...subItem.group && { group: subItem.group },
                ...subItem.reload && { reload: subItem.reload }
            });
        }));

        return routes.filter(subAppData => subAppData?.title);
    }

    return [];
}

// Gets the app's data from the master config, if it exists
async function getAppData(appId, propName, masterConfig) {
    const app = masterConfig[appId];
    if (app?.frontend) {
        if (app?.permissions && !app?.permissions?.apps) {
            if (!isVisible([appId], appId, await isCurrVisible(app.permissions))) {
                return ;
            }
        }

        const routes = await getRoutesForApp(app, masterConfig);

        if (routes?.length === 0 && app.frontend?.sub_apps) {
            return undefined;
        }

        return {
            title: app.frontend.title || app.title,
            ignoreCase: app.ignoreCase,
            ...!app.frontend.suppress_id && { id: appId },
            ...app.frontend.reload && { reload: app.frontend.reload },
            ...routes?.length > 0 && { [propName]: routes }
        };
    }
}

export async function loadNav(yamlConfig, cache) {
    let groupedNav = await cache.getItem('navigation');
    if (!groupedNav) {
        groupedNav = await getNavFromConfig(safeLoad(yamlConfig));
        cache.setItem('navigation', groupedNav);
    }

    const [active, section] = [getUrl('bundle'), getUrl('app')];
    const globalNav = (groupedNav[active] || groupedNav.insights)?.routes;
    return groupedNav[active] ? {
        globalNav,
        activeTechnology: groupedNav[active].title,
        activeLocation: active,
        activeSection: globalNav?.find?.(({ id }) => id === section)
    } : {
        globalNav,
        activeTechnology: 'Applications'
    };
}
