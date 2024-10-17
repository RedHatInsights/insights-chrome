# Local search development

You can develop and debug search results (homepage, the "Search for services" field) by running Insights Chrome together with chrome-service-backend.

## Prerequisites

1. Have a go language setup. You can follow the [gmv guide](https://github.com/moovweb/gvm#installing).
2. Have a podman installed. [Getting started guide](https://podman.io/get-started)
3. Have the [chrome-service-backend](https://github.com/RedHatInsights/chrome-service-backend) checkout locally.
4. Make sure you terminal supports the [Makefile](https://makefiletutorial.com/) utility.

## Setting up the development environment

chrome-service-backend is the bridge between kafka and the browser client. It exposes the search-index.json endpoint required for Chrome search to function.

### Run chrome-service-backend first

1. Follow the chrome-service-backend steps for local setup (`make dev-static` or `make dev-static-node` should be enough just to serve the static assets including search index).
2. You can request http://localhost:8000/api/chrome-service/v1/static/stable/stage/search/search-index.json (assuming you have left the default port settings) to test the connection and make sure that the chrome service is serving static assets.

### Generate the local search index

1. Follow the chrome-service-backend instructions to generate the search index as a JSON file (running `make generate-search-index` should be enough).

### Start Insights Chrome frontend

1. Once your chrome service backend is running, start the chrome dev server with the chrome service config using this command: `NAV_CONFIG=8000 yarn dev`.

When all the steps are complete, you should be able to see the search results (https://stage.foo.redhat.com:1337, "Search for services") provided from the locally generated search index. Any subsequent update to search index must be followed with `make generate-search-index` to regenerate the search index file.

### Debug tooling

You can enable additional logging of the search results when typing any prompt by editing [levenshtein-search.ts](../src/utils/levenshtein-search.ts) and setting `debugFlag` to true.