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
                    id: subApp.id ? subApp.id : '',
                    title: subApp.title ? subApp.title : ''
                };
                if (subApp.default) {
                    subAppData.default = subApp.default;
                }
            }

            routes.push(subAppData);
        }));
    }

    return routes;
}

function getAppData(appId, propName, masterConfig) {
    let appList = masterConfig.filter(x => x.id === appId);

    // Only return data if the app exists.
    if (appList.length > 0) {
        let app = appList[0];
        let formattedApp = {};
        formattedApp.id = app.id ? app.id : '';
        formattedApp.title = app.title ? app.title : '';

        // Optional fields
        formattedApp.default = app.default;
        formattedApp.reload = app.reload;
        formattedApp.group = app.group;
        formattedApp.disabledOnStable = app.disabled_on_stable;

        if (_.has(app, 'sub_apps')) {
            formattedApp[propName] = getRoutesForApp(app, masterConfig);
        }

        return formattedApp;
    } else {
        return;
    }
}
