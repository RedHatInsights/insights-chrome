import { visibilityFunctions, isVisible } from '../consts';

export let getNavFromConfig = async (masterConfig) => {
    return await Object.keys(masterConfig).filter(appId => masterConfig[appId].top_level).reduce(async (acc, appId) => {
        const routes = await getAppData(appId, 'routes', masterConfig);
        return {
            ...await acc,
            ...routes && { [appId]: routes }
        };
    }, {});
};

export async function calculateVisibility({ permissions: appPermisions }, { permissions, id }, groupVisibility) {
    const visibility = (permissions && visibilityFunctions[permissions.method]) ?
        await visibilityFunctions[permissions.method](...permissions.args || []) :
        true;
    return (
        isVisible([id], id, visibility) &&
        isVisible(appPermisions && appPermisions.apps, id, groupVisibility)
    );
}

// Returns a list of routes/subItems owned by an app
async function getRoutesForApp(app, masterConfig) {
    if (Object.prototype.hasOwnProperty.call(app, 'frontend') &&
        Object.prototype.hasOwnProperty.call(app.frontend, 'sub_apps')
    ) {
        const visibility = (app.permissions && visibilityFunctions[app.permissions.method]) ?
            await visibilityFunctions[app.permissions.method](...app.permissions.args || []) :
            true;

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

        return routes.filter(subAppData => {
            return (subAppData && subAppData.title) && !(subAppData.disabled_on_prod && window.location.hostname === 'cloud.redhat.com');
        });
    }

    return [];
}

// Gets the app's data from the master config, if it exists
async function getAppData(appId, propName, masterConfig) {
    const app = masterConfig[appId];
    if (app && Object.prototype.hasOwnProperty.call(app, 'frontend')) {
        if (app.permissions && !app.permissions.apps) {
            const visibility = await visibilityFunctions[app.permissions.method](...app.permissions.args || []);
            if (!isVisible([appId], appId, visibility)) {
                return ;
            }
        }

        const routes = await getRoutesForApp(app, masterConfig);
        let appData = {
            title: app.frontend.title || app.title,
            ignoreCase: app.ignoreCase
        };
        if (!app.frontend.suppress_id) {appData.id = appId;}

        if (app.frontend.reload) {appData.reload = app.frontend.reload;}

        if (app.disabled_on_prod) {
            appData.disabled_on_prod = app.disabled_on_prod; // eslint-disable-line camelcase
        }

        if (routes && routes.length > 0) {
            appData[propName] = routes;
        }

        if (routes && routes.length === 0 &&  Object.prototype.hasOwnProperty.call(app.frontend, 'sub_apps')) {
            return undefined;
        }

        return appData;
    }
}
