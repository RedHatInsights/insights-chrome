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
