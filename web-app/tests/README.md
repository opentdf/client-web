This folder container playwright, e2e tests for web-app,
running against a local or remote backend in proxy mode.


## Bring up backend behind local (vite dev server) proxy

To configure backend, you can either use the opentdf quickstart
or the backend repository directly.

### Quickstart

First, connect to your cluster or spin up a local cluster (e.g. using kind or minikube).

Next, check out the opentdf repository and start the quickstart.
```
git clone https://github.com/opentdf/opentdf.git
cd opentdf/quickstart
export OPENTDF_INGRESS_HOST_PORT=5432
export OPENTDF_LOAD_FRONTEND=
tilt up
```

Finally, bring up the web app:

```
cd web-app
npm run dev
```

## Run Tests

```
cd web-app/tests
npm i
npm test
```

To enable the large file tests, set

```
PLAYWRIGHT_TESTS_TO_RUN=huge roundtrip
```


## Running with test server for local URL streaming tests

To try encrypting some of your own files via HTTP:

```
cd web-app/tests
npm i
./run-server.js ~/Downloads
```

Then use the OR URL field in the sample app to load things up.
