const yaml = require('js-yaml');
const axios = require('axios');
const _ = require('lodash');

axios.get('https://raw.githubusercontent.com/RedHatInsights/cloud-services-config/enhancements/chrome-nav/main.yml')
.then(response => yaml.safeLoad(response.data)).then(data => buildNavFromConfig(data));

function buildNavFromConfig(masterConfig) {
    let globalNav = {};
    // Get the top-level apps from the master config
    masterConfig.filter(app => app.top_level).forEach((app) => {
        globalNav[app.id] = {
            title: app.title
        };
        globalNav[app.id].routes = getRoutesForApp(app, 'routes', masterConfig);
    });

    console.log('Global Nav:');
    console.log(JSON.stringify(globalNav));
}

// Returns a list of routes/subItems owned by an app
function getRoutesForApp(app, propName, masterConfig) {
    let routes = [];
    if (_.has(app, 'sub_apps')) {
        app.sub_apps.forEach((subApp => {
            let route = {};
            route.id = subApp.id ? subApp.id : '';
            if (subApp.default) {
                route.default = subApp.default;
            }

            if (subApp.reload) {
                route.reload = subApp.reload;
            }

            // If the title exists, you have all you need for this route.
            if (_.has(subApp, 'title')) {
                route.title = subApp.title;
            } else {
                // Look up app in masterConfig
                let lookupApp = masterConfig.filter(x => x.id === route.id)[0];
                if (lookupApp) {
                    route.title = lookupApp.title;
                    if (_.has(lookupApp, 'sub_apps')) {
                        route.subItems = getRoutesForApp(lookupApp, 'subItems', masterConfig);
                    }
                }
            }

            routes.push(route);
        }));
    }

    return routes;
}

function getAppData(appId, masterConfig) {
    let appList = masterConfig.filter(x => x.id === appId);

    // If the app doesn't exist, don't return anything.
    if (appList.length() > 0) {
        let app = appList[0];
        
    } else {
        return;
    }
}
