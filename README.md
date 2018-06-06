# Insights Chrome

The "wrapper" around your application!

Insights Chrome provides:
- Standard header, footer, navigation
- Base CSS/style
- A JavaScript library for interacting with Insights Chrome

# Beta usage

You can include/use chrome in your development project by running the insights-proxy (https://github.com/RedHatInsights/insights-proxy) in front of your application and using the following HTML template.

```
<!doctype html>
<html>
  <head>
    <!-- your own HEAD tags -->
    <esi:include src="/insightsbeta/static/chrome/snippets/head.html" />
  </head>
  <body>
    <esi:include src="/insightsbeta/static/chrome/snippets/header.html" />
    <!-- your own HTML -->
    <esi:include src="/insightsbeta/static/chrome/snippets/footer.html" />
  </body>
</html>
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
> npm run build:js:watch
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
