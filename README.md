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

### Running chrome with other applications locally

You can spin chrome locally together with other applications. Use `LOCAL_APPS` to list the locally deployed applications.

#### Example 1 (using fec static)

For illustration, to deploy Advisor together with Insights Chrome, you would require to

1. Ensure Advisor has the 'static: fec static' script
2. Run Advisor with `npm run static`
3. In Chrome, add advisor to the routes portion inside webpack.config.js `'/apps/advisor': {
    host: 'http://0.0.0.0:8003',
},`
4. In Chrome then run `npm run dev`
   - If youd like to run against a different env, this can be altered with the env variable, ex. 'prod-stable'.

#### Example 2 (using devServer route)

You can also specify deployed applications through devServer.routes field:

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
3. Run insights-chrome with `npm run dev`.

## Local search development

See [local search development documentation](./docs/localSearchDevelopment.md).

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

