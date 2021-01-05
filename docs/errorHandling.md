# Error Handling with Sentry

This project captures events with [Sentry.io](https://sentry.io/welcome/).

Out of the box, we capture all fatal errors. We also provide Sentry to developers so they can [throw their own errors](https://docs.sentry.io/error-reporting/capturing/?platform=javascript).

## Sentry object spec

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
