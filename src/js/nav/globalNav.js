export let getNavFromConfig = (masterConfig) => {
    console.log('master config:');
    console.log(masterConfig);
    let globalNav = {};
    // Get the top-level apps from the master config
    Object.keys(masterConfig).filter(appid => masterConfig[appid].top_level).forEach((appid) => {
        globalNav[appid] = getAppData(appid, 'routes', masterConfig);
    });
    console.log('global nav:');
    console.log(globalNav);
    return globalNav;
};

// Returns a list of routes/subItems owned by an app
function getRoutesForApp(app, masterConfig) {
    if (app.hasOwnProperty('frontend') && app.frontend.hasOwnProperty('sub_apps')) {
        let routes = [];
        app.frontend.sub_apps.forEach((subItem => {
            let subAppData = getAppData(subItem.id || subItem, 'subItems', masterConfig);
            if (!subAppData) {
                subAppData = {
                    id: subItem.id || '',
                    title: subItem.title || ''
                };
            }

            if (subItem.default) {subAppData.default = subItem.default;}

            routes.push(subAppData);
        }));
        return routes;
    }
}

// Gets the app's data from the master config, if it exists
function getAppData(appId, propName, masterConfig) {
    const app = masterConfig[appId];
    if (app && app.hasOwnProperty('frontend')) {
        const routes = getRoutesForApp(app, masterConfig);
        let appData = {
            title: app.frontend.title || app.title
        };
        if (!app.frontend.suppress_id) {appData.id = appId;}

        if (appData.reload) {appData.reload = app.frontend.reload;}

        if (routes) {appData[propName] = routes;}

        return appData;
    }
}
