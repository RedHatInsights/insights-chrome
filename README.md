# Insights Chrome

The "wrapper" around your application!

Insights Chrome provides:

- Standard header and [navigation](https://github.com/redhatinsights/insights-chrome/tree/master/docs/navigation.md)
- Base CSS/style
- A Javascript library for interacting with Insights Chrome

For more detailed information about chrome and what it provides, [look through the detailed documentation](https://github.com/redhatinsights/insights-chrome/tree/master/docs).

## JavaScript API

Insights Chrome comes with a Javascript API that allows applications to control navigation, global filters, etc.

Check out the [useChrome hook docs](http://front-end-docs-insights.apps.ocp4.prod.psi.redhat.com/chrome/chrome-api#Chrome)

## Running the build

There are a few scripts for building this application.

To run a script you have to install dependencies `npm install`. Then you are free to use any task you want.

1. Building assets

```sh
npm run build
```

2. Building assets and watching files when they change

```sh
npm run build --watch
```

3. Running tests

```sh
npm run test
```

## Running chrome locally

1. Install all dependencies

```sh
npm install
```

2. Run dev command in watch mode

```sh
npm run dev
```

3. Open browser at [stage.foo.redhat.com:1337](https://stage.foo.redhat.com:1337).

## Running chrome with other applications locally

### From app terminal

The following example will make use of the [frontend-starter-app](https://github.com/RedHatInsights/frontend-starter-app/). 

The [frontend-starter-app README](https://github.com/RedHatInsights/frontend-starter-app/#readme) explains how to install, build and run the app. To inject the `frontend-starter-app` into chrome, start by serving its static assets locally using the `npm run static` command. 

When visiting [localhost:8003/apps/frontend-starter-app](http://localhost:8003/apps/frontend-starter-app/) in a browser, you should see a listing of its files. The `baseURL` field in [fed-mods.json](http://localhost:8003/apps/frontend-starter-app/fed-mods.json) contains the path where the static assets can be accessed.  

### From chrome terminal

There are two ways to configure chrome to display your local app. 

### 1. `LOCAL_APPS` environment variable

```sh
LOCAL_APPS=frontend-starter-app:8003 
npm run dev
```

`frontend-starter-app` is the path segment after `/apps` defined in [fed-mods.json](http://localhost:8003/apps/frontend-starter-app/fed-mods.json).

Use a browser, to visit [/staging/starter](https://stage.foo.redhat.com:1337/staging/starter) in chrome to access `frontend-starter-app`.

`/staging/starter` is defined in [frontend-starter-app/deploy/frontend.yaml](https://github.com/RedHatInsights/frontend-starter-app/blob/master/deploy/frontend.yaml).

Behind the scenes chrome is parsing the `LOCAL_APPS` env var and creating the following route:

```js
{
  "/apps/frontend-starter-app": {
    host: "http://localhost:8003"
  }
}
```
which is further manipulated and turned into a [Webpack devServer.proxy config item](https://webpack.js.org/configuration/dev-server/#devserverproxy)

```js
{
  context: (path: string) => path.includes("/apps/frontend-starter-app"),
  target: "http://localhost:8003",
}
```

The `LOCAL_APPS` environment variable supports multiple apps and protocols using the following pattern `name:port[~protocol]`, where:

- `name`: The application name (path segment after `/apps`)
- `port`: The port number where your local app is running
- `protocol` (optional): `http` (default) or `https`

For example:

```sh
# Multiple apps
LOCAL_APPS=app1:8003,app2:8004,app3:8005

# Custom protocol  
LOCAL_APPS=secure-app:8443~https

# Mixed
LOCAL_APPS=app1:8003,secure-app:8443~https,app3:8005~http
```

### 2. Custom route

Edit [config/webpack.config.js](config/webpack.config.js) and add the following to the `routes` field of the config object passed to the `proxy` function. 

```js
{
  "/apps/frontend-starter-app": "http://localhost:8003"
}
```

Start the dev server.

```sh
npm run dev
```

Use browser to visit [/staging/starter](https://stage.foo.redhat.com:1337/staging/starter) in chrome to access the `frontend-starter-app`.

Note: The `proxy` function is defined in [frontend-components/packages/config-utils/src/proxy.ts](https://github.com/RedHatInsights/frontend-components/blob/master/packages/config-utils/src/proxy.ts).

## Local Search Feature

The Insights Chrome platform provides a local search functionality that allows applications to search through various types of content including services, quickstarts, and custom content types.

### Using the Search API

Applications can use the search functionality through the Chrome API:

```javascript
// Search for services (default)
const serviceResults = await chrome.search.query('insights', 'services');

// Search for quickstarts
const quickstartResults = await chrome.search.query('getting started', 'quickstarts');

// Search for custom content types
const customResults = await chrome.search.query('term', 'documentation');
```

### Adding Custom Search Content

Applications can register their own searchable content:

```javascript
// Register a new search entry
await chrome.search.insert({
  id: 'my-custom-entry',
  title: 'Custom Documentation', 
  description: 'Helpful documentation for users',
  pathname: '/my-app/docs',
  bundleTitle: 'My Application',
  type: 'documentation' // Custom type
});
```

### Supported Search Types

- **services**: Application services and tools (predefined)
- **quickstarts**: Interactive getting-started guides (predefined) 
- **custom types**: Applications can define their own search categories

### Using Search as a Remote Hook

Applications can also consume the search functionality using Module Federation via `@scalprum/react-core`:

```javascript
import { useRemoteHook } from '@scalprum/react-core';

function MyComponent() {
  const { hookResult, loading, error } = useRemoteHook({
    scope: 'chrome',
    module: './search/useSearch'
  });

  const handleSearch = async () => {
    if (!hookResult) return;
    const results = await hookResult.query('kubernetes', 'services');
    // Process results...
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading search</div>;

  return (
    // Your component JSX
  );
}
```

This approach allows applications to use search functionality without directly depending on the `useChrome` hook. See the [search hook documentation](./docs/searchHook.md) for detailed usage examples.

### Local Search Development

See [local search development documentation](./docs/localSearchDevelopment.md) for implementation details.

## LocalStorage Debugging

There are some localStorage values for you to enable debugging information or enable some values that are in experimental state. If you want to enable them call `const iqe = insights.chrome.enable.iqe()` for instance to enable such service. This function will return callback to disable such feature so calling `iqe()` will remove such item from localStorage.

Available function:

- `iqe` - to enable some iqe functions for QE purposes
- `invTags` - to enable experimental tags in inventory
- `jwtDebug` - to enable debugging of JWT
- `remediationsDebug` - to enable debug buttons in remediations app
- `shortSession` - to enable short session in order to test automatic logouts
- `forcePendo` - to force Pendo initialization
- `appFilter` - to enable new application filter in any environment

## Further reading

More detailed documentation can be found in the [docs section](https://github.com/redhatinsights/insights-chrome/tree/master/docs)

## Staleness

A bot will post a comment after 60 days of inactivity giving the opener 5 days to update their issue/PR before it's closed.

If you want the bot to ignore your issue or PR, please add one of the following labels:

- work-in-progress
- in-progress
- in-review
- help-wanted
- blocked
- wip
- dependencies

