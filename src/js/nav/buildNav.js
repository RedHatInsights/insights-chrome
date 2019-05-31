const yaml = require('js-yaml');
const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');

axios.get('https://raw.githubusercontent.com/RedHatInsights/cloud-services-config/enhancements/chrome-nav/main.yml')
.then(response => yaml.safeLoad(response.data)).then(data => buildNavFromConfig(data));

function buildNavFromConfig(masterConfig) {
    let globalNav = {};
    // Get the top-level apps from the master config
    masterConfig.filter(app => app.top_level).forEach((app) => {
        globalNav[app.id] = {
            title: app.title
        };
        globalNav[app.id].routes = getRoutesForApp(app, masterConfig);
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
    let routes = [];
    if (_.has(app, 'sub_apps')) {
        app.sub_apps.forEach((subApp => {
            let subAppData = getAppData(subApp.id, 'subItems', masterConfig);
            if (!subAppData) {
                subAppData = {
                    id: subApp.id || '',
                    title: subApp.title || ''
                };
            }

            subAppData.id = app.id_override || app.id;
            delete subAppData.id_override;
            delete subAppData.sub_apps;
            delete subAppData.channel;
            delete subAppData.deployment_repo;
            delete subAppData.frontend_paths;
            routes.push(subAppData);
        }));
    }

    return routes;
}

// Gets the app's data from the master config, if it exists
function getAppData(appId, propName, masterConfig) {
    let appList = masterConfig.filter(x => x.id === appId);

    // Only return data if the app exists.
    if (appList.length > 0) {
        let app = appList[0];
        if (_.has(app, 'sub_apps')) {
            app[propName] = getRoutesForApp(app, masterConfig);
        }

        return app;
    } else {
        return;
    }
}
