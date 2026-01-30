# UI Preview environment

Preview environment exists to allow the users to opt-in into experimental version of the HCC UI. This environment can contain future features. The environment is not considered stable!

## Legacy preview environment

> This environment is being decommissioned on **August 1, 2024**.

This environment can be access on any valid HCC URL simply by adding `/preview` to the URL host. This environment uses standalone deployments of the frontend modules (deployments can share builds).

## Upcoming preview environment

As of June 2024, the new preview environment is available. The HCC UI will be switched to this new preview environment on **August 1, 2024**.

### Accessing new preview

To test the preview functionality before the switch a localStorage flag needs to ne enabled. In the browser console use this command:

```js
window.insights.chrome.enable.forceLocalPreview()
```

After this, reload the browser window.

### Toggling preview

To toggle between stable/preview environments, use the preview toggle. Changing the URL will no longer have any effect.

### Distinguishing between stable/preview environments

## Using preview

To enable/disable preview features use one of the following:

> Using feature flags is recommended

### Feature flags

Feature flags can be used to enable/disable preview features. Chrome UI is adding a `platform.chrome.ui.preview` context variable. Use this context field in feature flags to enable/disable preview features.

#### React components

Follow the official docs: https://docs.getunleash.io/reference/sdks/react#check-feature-toggle-status

```jsx
import { useFlag } from '@unleash/proxy-client-react';

const TestComponent = () => {
  const enabled = useFlag('foo.bar');

  if (enabled) {
    return <SomeComponent />;
  }
  return <AnotherComponent />;
};

export default TestComponent;
```

#### Navigation

To conditionally display left navigation items based on feature flag values, use the `featureFlag` visibility function in the nav item definition:

```JSON
{
  "id": "foo",
  "appId": "foo",
  "title": "Foo",
  "href": "/foo/bar",
  "permissions": [
    {
      "method": "featureFlag",
      "args": ["foo.bar", true]
    }
  ]
}
```

#### Search index

To conditionally display items based on feature flags, use the `featureFlag` visibility functions in the associated link or static entry.

```JSON
{
  "id": "foo",
  "appId": "foo",
  "title": "Foo",
  "href": "/foo/bar",
  "permissions": [
    {
      "method": "featureFlag",
      "args": ["foo.bar", true]
    }
  ]
}
```

### `isBeta` Chrome API

> This API is deprecated. Please use the feature flags.

#### React components

Use the `useChrome` hook to access the `isBeta` method:

```jsx
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const Component = () => {
  const { isBeta } = useChrome()

  const isPreview = isBeta()

  return (
    ...
  )

}
```

#### Navigation

Not supported via chrome API

#### Search index

Not supported via chrome API
