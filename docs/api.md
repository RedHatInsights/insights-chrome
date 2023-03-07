# Javascript API

Chrome comes with a JavaScript API that allows applications to control navigation, global filters, etc.

```js
    // initialize chrome
    insights.chrome.init();

    // identify yourself (the application). This tells Chrome which global navigation element should be active
    insights.chrome.identifyApp('advisor');
```

## Full list of chrome functions

```js
chrome: {
    auth: {
        getOfflineToken,
        doOffline,
        getToken,
        getUser,
        qe,
        logout,
        login,
    },
    isProd,
    isBeta,
    isPenTest,
    getBundle,
    getApp,
    getEnvironment,
    createCase,
    visibilityFunctions,
    init,
    updateDocumentTitle
},
```

## Update document title

Please do not update title directly via `document.title`. Use one of following options.

### While identifying app
This is prefered way if the document title stays the same on each app page.
```js
insights.chrome.identifyApp('advisor', 'App title');
```

### Using updateDocumentTitle function
Can be used for changing app title in different app pages with a ` | console.redhat.com` suffix added automatically if not disabled by a second param.
```js
insights.chrome.updateDocumentTitle('New title without suffix', true)
```

## Global events

The following events can be observed:

* `APP_NAVIGATION` - fired when the application navigation option is selected. `event.domEvent.href` can be used to access navigation link href and compute application route.
* `GLOBAL_FILTER_UPDATE` - fired when user selects anything in global filter. Object with all selected tags is returned. Tags are groupped together under namespace in which there is another object with keys as tag key and additional meta information.

## Global actions

* `insights.chrome.appNavClick({id: 'some-id'})` is deprecated and has no effect on the navigation highlight. Navigation highlight is based purely on the current browser location
* ~~To activate certain app within your app (your app is using some kind of router and you want to activate certain part of navigation programatically) you can call function `insights.chrome.appNavClick({id: 'some-id'})` for first level nav and for second level navs you have to call `insights.chrome.appNavClick({id: 'ocp-on-aws', parentId: 'some-parent', secondaryNav: true})`~~

* You can also use Chrome to update a page action and object ID for OUIA. You can use `insights.chrome.appAction('action')` to activate a certain action, and `insights.chrome.appObjectId('object-id')` to activate a certain ID. For instance, if you want to open the "edit name" dialog for an entity with id=5, you should call `insights.chrome.appAction('edit-name')` and then `insights.chrome.appObjectId(5)`. Once the user is done editing, you have to call `insights.chrome.appAction()` and `insights.chrome.appObjectId()` in order to indicate that the action is done.

* If you want to scope global filter to specific source you can do that by firing `insights.chrome.globalFilterScope('insights')` (this will populate global filter with tags for systems only from insights source).

## Global filter

On all insights application users expect to see global filter with predefined options and every app should integrate with it.

### User selects in global filter

By default subscribing to `GLOBAL_FILTER_UPDATE` will return you an object with namespace and key as object keys. This is for more complex behaviors, when you want to filter our certain items or to do something else with this complex object.

#### Plain object descrition

Usefull if you know the partials and want to deal with the RAW data.

```js
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

```js
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = insights.chrome?.mapGlobalFilter?.(data);
    // [namespace with spaces/val=something] if you are using axios, this is the correct shape
});
```

#### Usage of `mapGlobalFilter` function with encoded data

If you want to encode tag partials (namespace, key or value) you can pass `true` as second parameter to this function to enable `uriEncoding`.

```js
insights.chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = insights.chrome?.mapGlobalFilter?.(data, true);
    // [namespace%20with%20spaces/val=something] if you are not using axios, this is the correct way
    // be careful when using this approach as it can escape twice (once manually and second time when sending data)
});
```

#### Prefered way of consuming data in structured format

If you want to consume each partial (workoads, SID and tags) as seperate entities instead of filtering them out you can pass 3rd argument as true and this function will return array with these items.

Usage with preformatted filter

```js
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

## Deprecated functions

* `insights.chrome.navigation` this is a legacy function and is no longer supported. Invoking it has no effect.

## Register custom module

If you want to register custom federated module you can do so by simply calling `insights.chrome.registerModule(module)`.

Where the `module` is name of the application that exposes fed-mods.json for loading federated modules. This function also consumes second parameter `manifest` to point where the manifest is located. For instance if your manifest is located at `/apps/$APP_NAME/js/static/manifest.json` where `$APP_NAME` is name of your application you want to pass in your path.

### Example of usage

If you are going to use chrome async component, make sure that you register the module before using it. If the module is not registered it will throw an error upon loading, you can safely register all modules you wish to use either on app render or conditionally check if user has rights for such screen partial and register right before calling the async component loader.

Once you register the module you can use [AsyncComponent](https://github.com/RedHatInsights/frontend-components/blob/master/packages/components/src/AsyncComponent/index.js) from frontend-components.


```JSX
import { React } from 'react'
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';

const MyCmp = () => <AsyncComponent appName="rbac" module="./Detail" />;

export default MyCmp;
```

This example requires the RBAC application to expose module `Detail` in the module federation plugin.

#### Without manifest

```JS
insights.chrome.registerModule('rbac')
```

This will register new module with name `rbac` with calculated manifest location.

#### With manifest location

```JS
insights.chrome.registerModule('rbac', `${window.location.origin}${isBeta() ? '/beta' : ''}/apps/${payload?.module}/js/fed-mods.json`)
```

This will register new module with name `rbac` and passes your own manifest location.
