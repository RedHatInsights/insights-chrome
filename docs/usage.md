# Using Chrome

You can include/use chrome in your development project by running the [insights-proxy](https://github.com/RedHatInsights/insights-proxy) in front of your application and using the following HTML template.

```html
<!doctype html>
<html>
  <head>
    <!-- your own HEAD tags -->
    <title> App Name </title>
    <esi:include src="/@@env/chrome/snippets/head.html" />
  </head>
  <body>
    <esi:include src="/@@env/chrome/snippets/body.html"/>
  </body>
</html>
```

Then, render your application to the "root" element. With React, for instance:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import getBaseName from './Utilities/getBaseName';

ReactDOM.render(
    <Router basename={ getBaseName(window.location.pathname) }>
        <App />
    </Router>,

    document.getElementById('root')
);
```

## Beta Builds

Chrome has both stable and beta builds. If your branch is defined as a "beta" branch, then chrome will resolve to a beta version. Otherwise, it will be defined as the stable version.

If you are seeing /beta prepended to your links and navigation items, there's a good chance your application is using a beta version of chrome instead of the stable.
