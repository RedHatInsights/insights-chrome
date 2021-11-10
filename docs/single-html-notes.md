# Single HTML template required changes

## Akamai/Fakamai settings

CDNs must resolve any HTML requests to `/apps/chrome`

## Webpack dev server

### Local chrome changes

Re router any HTML to local instance of chrome

```js
// config-utils/standalone/services/default/chrome/js 50:0
  if(req.url.includes('index.html')) {
      chunk = fs.readFileSync(path.resolve(chromePath, 'index.html'))
      res.setHeader('Content-Length', chunk.length);
  } else if (typeof chunk === 'string') {
```
