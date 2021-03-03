# Chrome 2.0

## Dependencies
- node v12 or higher
  - we plan using npm7 in the future so i would reccomend using node v15+ for future proofing (it ships with npm7)
- insights proxy
  - https://github.com/RedHatInsights/insights-proxy
  - follow installation instruction from the proxy readme
- use chroming-2.0 branch of insights chrome
- scalprum compatible advisor and catalog applications for testing
  - advisor branch: https://github.com/Hyperkid123/insights-advisor-frontend/tree/chrome-2.0-migration
  - catalog branch https://github.com/Hyperkid123/service_portal-ui/tree/chroming

## Local development
- in each JS project (chrome, advisor, catalog) run install command:
```sh
$ npm i
```
- run dev servers in advisor and catalog directories
```sh
$ npm run start
```
- run proxy with local chrome
```sh
$ cd <path to chrome>
$ npm run start
# in different terminal/tab
$ cd <path to chrome>
$ LOCAL_CHROME=true SPANDX_CONFIG=../profiles/local-frontends.js bash ~/<path to insights proxy>/scripts/run.sh
```

Open browser on this URL: `https://ci.foo.redhat.com:1337/insights/advisor`. It is necessary to run it on /insights/advisor. That is where the proxy is redirected (this will change later on).

## spandx config
The proxy is using spandx config to redirect network requests. Config for chrome 2.0 can be found in
```sh
$ <path to chrome>/profiles/local-frontends.js
```

Default configuration is following:
```js
const frontendHost = process.env.PLATFORM === 'linux' ? 'localhost' : 'host.docker.internal';
const SECTION = 'insights';
const APP_ID = 'advisor';
const routes = {};

const CATALOG_APP_ID = 'catalog';
const CATALOG_FRONTEND_PORT = 8003;

routes[`/apps/${SECTION}`] = { host: `http://${frontendHost}:8002` };
routes[`/apps/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/beta/apps/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/beta/${SECTION}/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/${SECTION}`] = { host: `http://${frontendHost}:8002` };
routes[`/${SECTION}/${APP_ID}`] = { host: `http://${frontendHost}:8002` };

routes[`/apps/${CATALOG_APP_ID}`] = { host: `https://${frontendHost}:${CATALOG_FRONTEND_PORT}` };

module.exports = { routes };
```

If you want to redirect requests for frontend assets, API servers or any other network calls, you can add/modify this file.

## Login
If you open your browser and click on advisor/catalog link in the left list, you might get redirected to SSO. Use any account that you would normally use on `ci.cloud.redhat.com`. If you don't have any credentinals, contact somebody from platform experience team.