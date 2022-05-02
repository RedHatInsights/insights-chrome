# Insights Chrome

The "wrapper" around your application!

Insights Chrome provides:

- Standard header and navigation
- Base CSS/style
- A JavaScript library for interacting with Insights Chrome

For more detailed information about chrome and what it provides, [look through the detailed documentation](https://github.com/redhatinsights/insights-chrome/tree/master/docs).

## Javascript API

Insights Chrome comes with a Javacript API that allows applications to control navigation, global filters, etc.

```js
    // initialize chrome
    insights.chrome.init();

    // identify yourself (the application). This tells Chrome which global navigation element should be active
    insights.chrome.identifyApp('advisor');
```

## Running the build

There is numerous of task for building this application. You can run individual tasks or run them in batch to build the
entire app or to watch files.

### Individual tasks

To run each task you have to first install dependencies `npm install` and then you are free to use any task as you wish.
If you want to watch file changes for each build just pass `-- -w` to specific task (this is not applicable to
`npm run build:js:watch` because it's somewhat specific).

1. Building of styles

    ```bash
    > npm run build:sass
    ```

2. Building of javascripts

    ```bash
    > npm run build:js
    ```

3. Building of javascripts and watching files when they change

    ```bash
    > npm run watch:js
    ```

4. Building of HTML partials

    ```bash
    > npm run build:pug
    ```

5. Running tests

    ```bash
    > npm run test
    ```

### Specific tasks

1. Run build of whole application just once

    ```bash
    > npm run build
    ```

2. Watching file changes and trigger build every time something changes

    ```bash
    > npm run start
    ```

## Running chrome locally

1. Install all dependencies

    ```bash
    > npm install
    ```

2. Run dev command in watch mode

    ```bash
    > npm run dev
    ```

3. Open browser at `https://stage.foo.redhat.com:1337/`.

Where `SPANDX_CONFIG` can be any config for your application (here is an example for [insights-frontend-starter-app](https://github.com/RedHatInsights/insights-frontend-starter-app)), just make sure your application is running `npm start` in said application.

After permorming these tasks you can access `ci.foo.redhat.com:1337/{bundle}/{app}`, where bundle and app are defined in your `local-frontend.js` and observe changes as you save them.

## LocalStorage Debugging

There are some localStorage values for you to enable debuging information or enable some values that are in experimental state. If you want to enable them call `const iqe = insights.chrome.enable.iqe()` for instance to enable such service. This function will return callback to disable such feature so calling `iqe()` will remove such item from localStorage.

Available function:

- `iqe` - to enable some iqe functions for QE purposes
- `invTags` - to enable experimental tags in inventory
- `jwtDebug` - to enable debugging of JWT
- `remediationsDebug` - to enable debug buttons in remediations app
- `shortSession` - to enable short session in order to test automatic logouts
- `forcePendo` - to force Pendo initializtion
- `appFilter` - to enable new application filter in any environment

## Futher reading

More detailed documentation can be found in the [docs section](https://github.com/redhatinsights/insights-chrome/tree/master/docs)
