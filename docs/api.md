# Javascript API

Chrome comes with a JavaScript API that allows applications to control navigation, global filters, etc.

The API is available via the `useChrome` hook exposed from the frontend components package.

```jsx
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const Component = () => {
    const chrome = useChrome()
    // use the API
    return (
        <div>...</div>
    )
}
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
chrome.identifyApp('advisor', 'App title');
```

### Using updateDocumentTitle function
Can be used for changing app title in different app pages with a ` | console.redhat.com` suffix added automatically if not disabled by a second param.
```js
chrome.updateDocumentTitle('New title without suffix', true)
```

## Global events

The following events can be observed:

* `APP_NAVIGATION` - fired when the application navigation option is selected. `event.domEvent.href` can be used to access navigation link href and compute application route.
* `GLOBAL_FILTER_UPDATE` - fired when user selects anything in global filter. Object with all selected tags is returned. Tags are groupped together under namespace in which there is another object with keys as tag key and additional meta information.

## Global actions

* You can also use Chrome to update a page action and object ID for OUIA. Functions are available from the `useChrome` hook. You can use `appAction('action')` to activate a certain action, and `appObjectId('object-id')` to activate a certain ID. For instance, if you want to open the "edit name" dialog for an entity with id=5, you should call `appAction('edit-name')` and then `appObjectId(5)`. Once the user is done editing, you have to call `appAction()` and `appObjectId()` in order to indicate that the action is done.

* If you want to scope global filter to specific source you can do that by firing `globalFilterScope('insights')` (this will populate global filter with tags for systems only from insights source).

## Global filter

On all insights application users expect to see global filter with predefined options and every app should integrate with it.

### User selects in global filter

By default subscribing to `GLOBAL_FILTER_UPDATE` will return you an object with namespace and key as object keys. This is for more complex behaviors, when you want to filter our certain items or to do something else with this complex object.

#### Plain object descrition

Usefull if you know the partials and want to deal with the RAW data.

```js
const chrome = useChrome()
chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
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

If you simply want to filter systems based on these values we provide a helper function `mapGlobalFilter` from the `useChrome` hook, which transforms object into one level array with tags in `${namespace}/${key}=${value}` shape. This function accepts one parameter, that is the filter object returned from `GLOBAL_FILTER_UPDATE` event.

```js
const chrome = useChrome()
chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = chrome.mapGlobalFilter?.(data);
    // [namespace with spaces/val=something] if you are using axios, this is the correct shape
});
```

#### Usage of `mapGlobalFilter` function with encoded data

If you want to encode tag partials (namespace, key or value) you can pass `true` as second parameter to this function to enable `uriEncoding`.

```js
const chrome = useChrome()
chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = chrome.mapGlobalFilter.(data, true);
    // [namespace%20with%20spaces/val=something] if you are not using axios, this is the correct way
    // be careful when using this approach as it can escape twice (once manually and second time when sending data)
});
```

#### Prefered way of consuming data in structured format

If you want to consume each partial (workoads, SID and tags) as seperate entities instead of filtering them out you can pass 3rd argument as true and this function will return array with these items.

Usage with preformatted filter

```js
const chrome = useChrome()
chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const [ workloads, SID, selectedTags ] = chrome.mapGlobalFilter.(data, false, true);
    // workloads = { SAP: { isSelected: true } }
    // SID = [1543, 48723, 'AAA'] (only selected SIDs)
    // selectedTags = [namespace with spaces/val=something]
});
```

### Toggle global filter on certain pages

If you wish to hide the global filter on any route simply call `hideGlobalFilter()` from the `useChrome` hook. Once you do that global filter will be hidden on all pages in your application.

If you want to hide it on certain screens call `hideGlobalFilter()` on them (preferably in `useEffect` after component mounts) and on screens you want to show it call `hideGlobalFilter(false)`.

```js
const chrome = ueChrome()

chrome.hideGlobalFilter()
```

## Creating Support Cases

You can access the ability to create support cases by calling a function from the `useChrome` hook.

```js
const chrome = ueChrome()

chrome.createCase()
```

By default, the fields that are sent are:

```js
    createdBy: 'foo-username',
    environment: 'Production',
    product: 'Red Hat Insights',
```

You have the ability to add a few custom fields with the following API:

``` js
const chrome = useChrome()

chrome.createCase({
    caseFields: {
        key: 'any case specific values'
    },
    // anything not inside of "caseFields" will be sent to sentry
    foo: {
        key: 'additional value'
    }
})
```

You can also configure the version and product of the support cases:

```js
const chrome = useChrome()

chrome.createCase({
    supportCaseData: {
        product: 'Red Hat Insights',
        version: 'Advisor',
    },
    caseFields: {}
    ...
})
```

## Deprecated functions

* `chrome.navigation` this is a legacy function and is no longer supported. Invoking it has no effect.

## Register custom module

If you want to register custom federated module you can do so by simply calling `chrome.registerModule(module)`.

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
const chrome = useChrome()
chrome.registerModule('rbac')
```

This will register new module with name `rbac` with calculated manifest location.

#### With manifest location

```JS
const chrome = useChrome()
chrome.registerModule('rbac', `${window.location.origin}${isBeta() ? '/beta' : ''}/apps/${payload?.module}/js/fed-mods.json`)
```

This will register new module with name `rbac` and passes your own manifest location.

## Drawer Content

Chrome provides a side drawer that can display dynamic content from HCC modules. Applications can control drawer content using the drawer actions API.

### Accessing Drawer Actions

Drawer actions are available through the `drawerActions` property of the chrome API:

```jsx
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const Component = () => {
    const { drawerActions } = useChrome();

    return (
        <button onClick={() => drawerActions.toggleDrawerContent({
            scope: 'myApp',
            module: './MyDrawerPanel'
        })}>
            Toggle My Panel
        </button>
    );
};
```

### Available Drawer Actions

#### `toggleDrawerContent(data)`

Toggles the drawer content intelligently. If the drawer is closed or contains different content, it will open with the new content. If the drawer is already open with the same content, it will close.

**Parameters:**
- `data` (Object): ScalprumComponentProps object with the following properties:
  - `scope` (string, required): The HCC module scope name
  - `module` (string, required): The module path (e.g., './MyComponent')
  - Any additional props are passed directly to the component (not wrapped in a `props` object)

**Example:**
```jsx
const { drawerActions } = useChrome();

// Open help panel
drawerActions.toggleDrawerContent({
    scope: 'learningResources',
    module: './HelpPanel'
});

// Open custom panel with direct props
drawerActions.toggleDrawerContent({
    scope: 'myApp',
    module: './UserDetails',
    userId: 123,
    onClose: () => console.log('Panel closed')
});
```

#### `setDrawerPanelContent(data)`

Directly sets the drawer content without toggling the drawer state.

**Parameters:**
- `data` (Object): Same as `toggleDrawerContent`, or `undefined` to clear content

**Example:**
```jsx
const { drawerActions } = useChrome();

// Set content with props
drawerActions.setDrawerPanelContent({
    scope: 'notifications',
    module: './NotificationPanel',
    userId: 123,
    showCount: true
});

// Clear content
drawerActions.setDrawerPanelContent(undefined);
```

#### `toggleDrawerPanel()`

Toggles the drawer open/closed state without changing the content.

**Example:**
```jsx
const { drawerActions } = useChrome();

drawerActions.toggleDrawerPanel();
```

### Creating Drawer Content Components

Drawer content must be exposed as an HCC module. Your component will receive standard props:

```jsx
// MyDrawerPanel.tsx
import React from 'react';

interface DrawerPanelProps {
    toggleDrawer: () => void; // Function to close the drawer
    panelRef: React.Ref<unknown>; // Ref for the panel container
    // Your custom props passed via the props parameter
}

const MyDrawerPanel = ({ toggleDrawer, panelRef, ...customProps }: DrawerPanelProps) => {
    return (
        <div ref={panelRef}>
            <h2>My Custom Panel</h2>
            <p>Content goes here...</p>
            <button onClick={toggleDrawer}>Close</button>
        </div>
    );
};

export default MyDrawerPanel;
```

### Real-World Example

For a complete implementation example, see the [HelpPanel component](https://github.com/RedHatInsights/learning-resources/blob/master/src/components/HelpPanel/HelpPanelContent.tsx#L25-L139) from the learning-resources HCC module. This shows:

- How to structure a federated module for drawer content
- Proper TypeScript interfaces and prop handling

### Best Practices

1. **Scoping**: Use unique scope names to avoid conflicts with other applications
2. **Toggle State**: Use `toggleDrawerContent` for most use cases as it handles state intelligently
3. **Cleanup**: Clear drawer content when navigating away from your application if needed
4. **Loading States**: Your component should handle loading states internally; Chrome provides a default spinner

### Complete Example

Here's a complete example of a component that manages drawer content:

```jsx
import React, { useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Button } from '@patternfly/react-core';

const MyComponent = () => {
    const { drawerActions } = useChrome();
    const [selectedUser, setSelectedUser] = useState(null);

    const openUserDetails = (user) => {
        setSelectedUser(user);
        drawerActions.toggleDrawerContent({
            scope: 'userManagement',
            module: './UserDetailsPanel',
            user,
            onUserUpdated: (updatedUser) => {
                setSelectedUser(updatedUser);
                // Refresh your data...
            }
        });
    };

    const closeDrawer = () => {
        drawerActions.setDrawerPanelContent(undefined);
        setSelectedUser(null);
    };

    return (
        <div>
            <Button onClick={() => openUserDetails({ id: 1, name: 'John Doe' })}>
                View User Details
            </Button>
            {selectedUser && (
                <Button variant="secondary" onClick={closeDrawer}>
                    Close Details
                </Button>
            )}
        </div>
    );
};

export default MyComponent;
```
