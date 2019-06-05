const yaml = require('js-yaml');
const axios = require('axios');
const fs = require('fs');

axios.get('https://raw.githubusercontent.com/RedHatInsights/cloud-services-config/enhancements/chrome-nav/main.yml')
.then(response => yaml.safeLoad(response.data)).then(data => buildNavFromConfig(data));

function buildNavFromConfig(masterConfig) {
    let globalNav = {};
    // Get the top-level apps from the master config
    Object.keys(masterConfig).filter(appid => masterConfig[appid].top_level).forEach((appid) => {
        globalNav[appid] = {
            title: masterConfig[appid].frontend.title || masterConfig[appid].title
        };
        globalNav[appid].routes = getRoutesForApp(masterConfig[appid], masterConfig);
    });

    // Write to appropriate file
    fs.writeFile('src/js/nav/globalNav.json', JSON.stringify(globalNav), 'utf8', function(err) {
        if (err) {
            throw err;
        }
    });

}

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

            subAppData.default = subItem.default;
            routes.push(subAppData);
        }));
        return routes;
    }
}

// Gets the app's data from the master config, if it exists
function getAppData(appId, propName, masterConfig) {
    const app = masterConfig[appId];
    if (app && app.hasOwnProperty('frontend')) {
        return {
            id: app.frontend.suppress_id ? undefined : appId,
            title: app.frontend.title || app.title,
            reload: app.frontend.reload,
            [propName]: getRoutesForApp(app, masterConfig)
        };
    }
}
