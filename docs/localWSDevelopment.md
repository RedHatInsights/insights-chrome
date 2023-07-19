# Local WS development

## Prerequisites

1. Have a go language setup. You can follow the [gmv guide](https://github.com/moovweb/gvm#installing).
2. Have a podman installed. [Getting started guide](https://podman.io/get-started)
3. Have the [chrome-service-backend](https://github.com/RedHatInsights/chrome-service-backend) checkout locally.
4. Make sure you terminal supports the [Makefile](https://makefiletutorial.com/) utility.

## Setting up the development environment

### Chrome service backend

The chrome service backend is the bridge between kafka and the browser client. It exposes a WS endpoint that allows the browser to connect to the service.

> **__Note__** these steps start only the minimal required infrastructure.

To enable it for local development with chrome UI follow these steps:

1. Make sure you are on the `main` branch or have created new branch fro the latest `main`.
2. <a name="bypass"></a>If the WS feature is hidden behind a feature flag, and you don't want to go through the FF setup, [bypass this condition](https://github.com/RedHatInsights/chrome-service-backend/blob/main/main.go#L61) by adding `true || ..` to the condition in your local repository.
3. Start the kafka container by running `make kafka`.
4. Start the chrome service by running `go run .` in the repo root.
5. Run a `go run cmd/kafka/testMessage.go` to test the connection. You should see a log in the terminal from where the go server was started.

#### The `make kafka` command failed.

It is possible that you have services running on your machine that occupy either the kafka or postgres ports. To change the default values, open the `local/kafka-compose.yaml` and change the postgres or kafka (or both) port bindings:

```diff
diff --git a/local/kafka-compose.yaml b/local/kafka-compose.yaml
index f8f3451..60fc9cd 100644
--- a/local/kafka-compose.yaml
+++ b/local/kafka-compose.yaml
@@ -8,7 +8,7 @@ services:
     - POSTGRES_USER=chrome
     - POSTGRES_PASSWORD=chrome
     ports:
-    - "5432:5432"
+    - "5555:5432"
     volumes:
     - db:/var/lib/postgresql/data
 
@@ -17,7 +17,7 @@ services:
     hostname: zoo1
     container_name: zoo1
     ports:
-    - "2181:2181"
+    - "8888:2181"
     environment:
       ZOOKEEPER_CLIENT_PORT: 2181
       ZOOKEEPER_SERVER_ID: 1

```

#### The `go run cmd/kafka/testMessage.go`

The command will not work if the main server is not running, or the ws consumer did not start. Ensure you either have feature flags setup or you have bypassed the condition listed in the [step 2](#bypass).


### Chrome frontend

1. ensure you are on the latest version for chrome `master` branch. The support for WS client was added in [#2525](https://github.com/RedHatInsights/insights-chrome/pull/2525).
2. Once your chrome service backend is running, start the chrome dev server with the chrome service config using this command: `CHROME_SERVICE=8000 yarn dev`.
3. The WS client connection is hidden behind a `platform.chrome.notifications-drawer` feature flag. If its not available in your current environment (stage or prod or EE), bypass the feature flag condition in the `src/hooks/useChromeServiceEvents.ts` file.
4. OPen the browser, open the browser console, emit a custom message from the chrome service terminal using `go run cmd/kafka/testMessage.go`.
5. In the network tab of your browser console, filter only to show `ws` communication, click on related ws connection (there will be a couple for webpack dev server, ignore these) and observer the messages being pushed down to the browser.

#### Sample WS message payload

```js
{
  // the actual payload consumed by chrome
  data: {
    description: "Some longer description",
    title: "New notification"
  },
  // cloud events sub protocol metadata
  datacontenttype: "application/json",
  id: "test-message",
  source: "https://whatever.service.com",
  specversion: "1.0.2",
  time: "2023-05-23T11:54:03.879689005+02:00",
  // a type field used to identify message purpose
  type: "notifications.drawer"
}
```
