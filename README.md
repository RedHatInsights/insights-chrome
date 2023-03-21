# Insights Chrome

The "wrapper" around your application!

Insights Chrome provides:

- Standard header and navigation
- Base CSS/style
- A Javascript library for interacting with Insights Chrome

For more detailed information about chrome and what it provides, [look through the detailed documentation](https://github.com/redhatinsights/insights-chrome/tree/master/docs).

## JavaScript API

Insights Chrome comes with a Javacript API that allows applications to control navigation, global filters, etc.

```js
    // initialize chrome
    insights.chrome.init();

    // identify yourself (the application). This tells Chrome which global navigation element should be active
    insights.chrome.identifyApp('advisor');
```

## Running the build

There are a few scripts for building this application.

To run a script you have to install dependencies `npm install`. Then you are free to use any task you want.

1. Building assets

    ```bash
    > npm run build
    ```

2. Building assets and watching files when they change

    ```bash
    > npm run build --watch
    ```

3. Running tests

    ```bash
    > npm run test
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

### Running chrome as a host application.

As with any application, chrome can be a host application for others. You can configure the `routes` object in the `webpack.config.js` file as described in the proxy config [docs](https://github.com/RedHatInsights/frontend-components/tree/master/packages/config#routes).

#### Example

For illustration, to locally deploy Advisor for OpenShift together with Insights Chrome, you would require to 
1. Run Advisor with `--port=8004` (or any other available port number),
2. Update the webpack config in the following way:
```
...
devServer: {
    ...
    routes: {
        '/apps/ocp-advisor': {
            host: 'https://localhost:8004',
        },
    },
}
...
```
3. Run insights-chrome with `npm run dev` or `npm run dev:beta`.

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
