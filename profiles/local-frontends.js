const frontendHost = process.env.PLATFORM === 'linux' ? 'localhost' : 'host.docker.internal';
const SECTION = 'insights';
const APP_ID = 'advisor';
const routes = {};

const CATALOG_APP_ID = 'catalog';
const CATALOG_FRONTEND_PORT = 8003;

routes[`/dev/config`] = { host: `https://cloud.redhat.com` };

routes[`/apps/${SECTION}`] = { host: `http://${frontendHost}:8002` };
routes[`/apps/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/beta/apps/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/beta/${SECTION}/${APP_ID}`] = { host: `http://${frontendHost}:8002` };
routes[`/${SECTION}`] = { host: `http://${frontendHost}:8002` };
routes[`/${SECTION}/${APP_ID}`] = { host: `http://${frontendHost}:8002` };

routes[`/apps/${CATALOG_APP_ID}`] = { host: `https://${frontendHost}:${CATALOG_FRONTEND_PORT}` };

module.exports = { routes };
