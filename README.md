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
    <esi:include src="/insightsbeta/static/chrome/snippets/head.html" />
  </head>
  <body>
    <esi:include src="/@@insights/static/chrome/snippets/body.html"/>
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

    // define application navigation (navigation submenu)
    // at most one of the elements should be declared active
    // the operation is idempotent
    insights.chrome.navigation([{
        id: 'stability',
        title: 'Stability'
    }, {
        id: 'performance',
        title: 'Performance',
        active: true
    }]);

    // register a listener for application navigation events
    const unregister = insights.chrome.on('APP_NAVIGATION', event => {
        // change application route in response to navigation event from Chrome
        history.push(`/${event.navId}`);
    });

    // the listener can be unregistered if needed
    unregister();
```

The following events can be observed:
* `APP_NAVIGATION` - fired when the application navigation option is selected. `event.navId` can be used to access the id of the navigation option

To activate certain app within your app (your app is using some kind of router and you want to activate certain part of navigation programatically) you can call function `insights.chrome.appNavClick({id: 'some-id'})` for first level nav and for second level navs you have to call `insights.chrome.appNavClick({id: 'ocp-on-aws', secondaryNav: true})`

To update page action and object ID for OUIA you can send `insights.chrome.appAction('action')` to activate certain action and `insights.chrome.appObjectId('object-id')` to activate certain ID. So for instance if you open edit name dialog for entity with id 5 you should call `insights.chrome.appAction('edit-name')` and `insights.chrome.appObjectId(5)`. Once user is done with editing you have to call `insights.chrome.appAction()` and `insights.chrome.appObjectId()` in order to indicate that the action is done.

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

## LocalStorage Debugging

To set a short jwt session, log out of your account and then do the following in the web console:

`window.localStorage.setItem('chrome:jwt:shortSession', true);`

Note: You must log out of your short session and set `window.localStorage.setItem('chrome:jwt:shortSession', false);` to return to the regular realm.

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
