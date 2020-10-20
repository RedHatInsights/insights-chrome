# Insights Chrome

The "wrapper" around your application!

Insights Chrome provides:
- Standard header and navigation
- Base CSS/style
- A JavaScript library for interacting with Insights Chrome

# Beta usage

You can include/use chrome in your development project by running the insights-proxy (https://github.com/RedHatInsights/insights-proxy) in front of your application and using the following HTML template.

```html
<!doctype html>
<html>
  <head>
    <!-- your own HEAD tags -->
    <esi:include src="/@@env/chrome/snippets/head.html" />
  </head>
  <body>
    <esi:include src="/@@env/chrome/snippets/body.html"/>
  </body>
</html>
```

Then, render your application to the "root" element. With React, for instance:

```js
ReactDOM.render(
    <Provider store={ init().getStore() }>
        <Router basename={ `/${RELEASE}/platform/(project_name)` }>
            <App />
        </Router>
    </Provider>,
    document.getElementById('root')
);
```

## Javascript API
Insights Chrome comes with a Javacript API that allows applications to control navigation, global filters, etc.

```js
    // initialize chrome
    insights.chrome.init();

    // identify yourself (the application). This tells Chrome which global navigation element should be active
    insights.chrome.identifyApp('advisor');
```

### Deprecated functions
- `insights.chrome.navigation` this is a legacy function and is no longer supported. Invoking it has no effect.

#### Global events

The following events can be observed:
* `APP_NAVIGATION` - fired when the application navigation option is selected. `event.navId` can be used to access the id of the navigation option
* `NAVIGATION_TOGGLE` - fired when user clicks on burger to hide navigation. No data are given.
* `GLOBAL_FILTER_UPDATE` - fired when user selects anything in global filter. Object with all selected tags is returned. Tags are groupped together under namespace in which there is another object with keys as tag key and additional meta information.

#### Global actions

* To activate certain app within your app (your app is using some kind of router and you want to activate certain part of navigation programatically) you can call function `insights.chrome.appNavClick({id: 'some-id'})` for first level nav and for second level navs you have to call `insights.chrome.appNavClick({id: 'ocp-on-aws', parentId: 'some-parent', secondaryNav: true})`

* You can also use Chrome to update a page action and object ID for OUIA. You can use `insights.chrome.appAction('action')` to activate a certain action, and `insights.chrome.appObjectId('object-id')` to activate a certain ID. For instance, if you want to open the "edit name" dialog for an entity with id=5, you should call `insights.chrome.appAction('edit-name')` and then `insights.chrome.appObjectId(5)`. Once the user is done editing, you have to call `insights.chrome.appAction()` and `insights.chrome.appObjectId()` in order to indicate that the action is done.

* If you want to scope global filter to specific source you can do that by firing `insights.chrome.globalFilterScope('insights')` (this will populate global filter with tags for systems only from insights source).


## Permissions

List of available permissions methods:
 * `isOrgAdmin` - test if logged in user is organization admin
 * `isActive` - test if logged in user is active
 * `isInternal` - test if logged in user is internal
 * `isEntitled` - test if logged in user is entitled, entitlements to check for is passed as an argument
 * `isProd` - test if current environment is production (prod-beta and prod-stable)
 * `isBeta` - test if current environment is beta (ci-beta, qa-beta and prod-beta)
 * `hasPermissions` - test if current user has rbac role permissions ['app:scope:permission']
 * `apiRequest` - call custom API endpoint to test if the item should be displayed

 ### apiRequest example
 ```yml
 app:
  title: App title
  api:
    versions:
      - v1
  frontend:
    paths:
      - /foo/bar
    sub_apps:
      - id: sub-app-one
        title: sub-app-one
      - id: dynamic-sub-app
        title: dynamic-sub-app
        permissions:
        method: apiRequest
        args: # acceps all axios request config options https://github.com/axios/axios#request-config
        - url: "/request/url"
          foo: bar

 ```

## Global filter

On all insights application users expect to see global filter with predefined options and every app should integrate with it.

### User selects in global filter

By default subscribing to `GLOBAL_FILTER_UPDATE` will return you an object with namespace and key as object keys. This is for more complex behaviors, when you want to filter our certain items or to do something else with this complex object.

#### Plain object descrition

Usefull if you know the partials and want to deal with the RAW data.

```JS
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    /*
    do something with data object, the shape of this object is
    { 'namespace with spaces': { val: { isSelected: true, value: 'something' } } }
    if uses selects SAP the object will contain
    { Workloads: { SAP: { isSelected } } }
    is user selects SID the object will contain
    { 'SAP ID (SID)': { AAA: { isSelected: true } } }
    */
   // if you want to break the data object to its parts you can do that with desctrucor
   const { 'SAP ID (SID)': SID, Workloads, ...tags } = data;
});
```

#### Basic usage of `mapGlobalFilter` function

If you simply want to filter systems based on these values we provide a helper function `insights.chrome.mapGlobalFilter` which transforms object into one level array with tags in `${namespace}/${key}=${value}` shape. This function accepts one parameter, that is the filter object returned from `GLOBAL_FILTER_UPDATE` event.


```JS
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = insights.chrome?.mapGlobalFilter?.(data);
    // [namespace with spaces/val=something] if you are using axios, this is the correct shape
});
```

#### Usage of `mapGlobalFilter` function with encoded data

If you want to encode tag partials (namespace, key or value) you can pass `true` as second parameter to this function to enable `uriEncoding`.


```JS
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = insights.chrome?.mapGlobalFilter?.(data, true);
    // [namespace%20with%20spaces/val=something] if you are not using axios, this is the correct way
    // be careful when using this approach as it can escape twice (once manually and second time when sending data)
});
```

#### Prefered way of consuming data in structured format

If you want to consume each partial (workoads, SID and tags) as seperate entities instead of filtering them out you can pass 3rd argument as true and this function will return array with these items.

Usage with preformatted filter
```JS
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const [ workloads, SID, selectedTags ] = insights.chrome?.mapGlobalFilter?.(data, false, true);
    // workloads = { SAP: { isSelected: true } }
    // SID = [1543, 48723, 'AAA'] (only selected SIDs)
    // selectedTags = [namespace with spaces/val=something]
});
```

### Toggle global filter on certain pages

If you wish to hide the global filter on any route simply call `insights.chrome.hideGlobalFilter()` once you do that global filter will be hidden on all pages in your application.

If you want to hide it on certain screens call `insights.chrome.hideGlobalFilter()` on them (preferably in `componentDidMount` function) and on screens you want to show it call `insights.chrome.hideGlobalFilter(false)`. 

# Running the build
There is numerous of task for building this application. You can run individual tasks or run them in batch to build the
entire app or to watch files.

#### Individual tasks
To run each task you have to first install dependencies `npm install` and then you are free to use any task as you wish.
If you want to watch file changes for each build just pass `-- -w` to specific task (this is not applicable to
`npm run build:js:watch` because it's somewhat specific).
1) Building of styles
```bash
> npm run build:sass
```

2) Building of javascripts
```bash
> npm run build:js
```

3) Building of javascripts and watching files when they change
```bash
> npm run watch:js
```

4) Building of HTML partials
```bash
> npm run build:pug
```

5) Running tests
```bash
> npm run test
```

#### Specific tasks
1) Run build of whole application just once
```bash
> npm run build
```

2) Watching file changes and trigger build every time something changes
```bash
> npm run start
```

# Running chrome locally
First install all dependencies

```
> npm install
```

Run build command in watch mode

```
> npm run watch
```

Open new terminal, navigate to build directory and run proxy
```
SPANDX_CONFIG=../../insights-frontend-starter-app/profiles/local-frontend.js \
LOCAL_CHROME=true \
bash ../../insights-proxy/scripts/run.sh
```

Where `SPANDX_CONFIG` can be any config for your application (here is an example for [insights-frontend-starter-app](https://github.com/RedHatInsights/insights-frontend-starter-app)), just make sure your application is running `npm start` in said application.

After permorming these tasks you can access `ci.foo.redhat.com:1337/insights/starter` and observe changes as you save them.

### Shape of SPANDX_CONFIG

You can have custom spandx config with all frontend apps specified if you want to, the `.js` file just have to export `routes` object with at least 2 paths: 

```
module.exports = {
    routes: {
        // you will access the UI on this URL /$BUNDLE/$APP
        '/$BUNDLE/$APP': { host: `https://localhost:8002` },


        // here are your files stored, if you used frontend starter app it will automatically build them
        // in apps/$APP folder
        '/apps/$APP': { host: `https://localhost:8002` },
    }
}
```



## LocalStorage Debugging

There are some localStorage values for you to enable debuging information or enable some values that are in experimental state. If you want to enable them call `const iqe = insights.chrome.enable.iqe()` for instance to enable such service. This function will return callback to disable such feature so calling `iqe()` will remove such item from localStorage.

Available function:

* `iqe` - to enable some iqe functions for QE purposes
* `invTags` - to enable experimental tags in inventory
* `jwtDebug` - to enable debugging of JWT
* `remediationsDebug` - to enable debug buttons in remediations app
* `shortSession` - to enable short session in order to test automatic logouts
* `forcePendo` - to force Pendo initializtion

## Sentry

This project captures events with [Sentry.io](https://sentry.io/welcome/).

Out of the box, we capture all fatal errors. We also provide Sentry to developers so they can [throw their own errors](https://docs.sentry.io/error-reporting/capturing/?platform=javascript).

Sentry object spec:

``` js

    Sentry.init({
        dsn: API_KEY, // API key
        environment: `Prod${appDetails.beta}`, // We only want to init on Prod and prod-beta
        maxBreadcrumbs: 50, // Max lines from error to trace
        attachStacktrace: true, // Attach the console.logs
        debug: true // Print Debugging information
        sampleRate: 1.0 // Percentage of events to send (this is a default and not needed)
    });

    Sentry.configureScope((scope) => {

        // User information
        scope.setUser({
            id: account_number, // 540155
            account_id: account_id // Personal number
        });

        // Other tags not natively collected by Sentry
        scope.setTags({
            // App info: cloud.redhat.com/[app.group]/[app.name]
            app_group: app.group,
            app_name: app.name,

            // Location: frontend. Backends can also send events, so we want to be able to query on this
            location: 'frontend',

            // Browser width
            browser_width: window.innerWidth + ' px'
        });
    });
```

## Creating Support Cases

You can access the ability to create support cases by calling `window.insights.chrome.createCase()`.

By default, the fields that are sent are:

```js
    createdBy: 'foo-username',
    environment: 'Production',
    product: 'Red Hat Insights',
```

You have the ability to add a few custom fields with the following API:

``` js
window.insights.chrome.createCase({
    caseFields: {
        key: 'any case specific values'
    },
    // anything not inside of "caseFields" will be sent to sentry
    foo: {
        key: 'additional value'
    }
})
```
