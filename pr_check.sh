#!/bin/bash

env 

export COMPONENT="insights-chrome-frontend"
export IMAGE="quay.io/cloudservices/$COMPONENT"
export WORKSPACE=${WORKSPACE:-$APP_ROOT}  # if running in jenkins, use the build's workspace
export APP_ROOT=$(pwd)
export INCLUDE_CHROME_CONFIG="true"
export DIST_FOLDER=build
export LANG=C.UTF-8
cat /etc/redhat-release
COMMON_BUILDER=https://raw.githubusercontent.com/RedHatInsights/insights-frontend-builder-common/master

# ---------------------------
# Build and Publish to Quay
# ---------------------------

set -e

docker run -t \
  -v $PWD:/e2e:ro,Z \
  -w /e2e \
  -e CHROME_ACCOUNT=$CHROME_ACCOUNT \
  -e CHROME_PASSWORD=$CHROME_PASSWORD \
  --add-host stage.foo.redhat.com:127.0.0.1 \
  --add-host prod.foo.redhat.com:127.0.0.1 \
  --entrypoint bash \
  quay.io/cloudservices/cypress-e2e-image:06b70f3 /e2e/run-e2e.sh

# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=$?

## === Bonfire/Clowder/IQE stuff goes here ===

# Ensure that we deploy the right component for testing
export APP_NAME=rbac
export COMPONENT="rbac"
export COMPONENT_NAME="rbac"

# Install bonfire
CICD_URL=https://raw.githubusercontent.com/RedHatInsights/bonfire/master/cicd
curl -s $CICD_URL/bootstrap.sh > .cicd_bootstrap.sh 

source .cicd_bootstrap.sh

echo "Taking a short nap"
sleep 60

SHORT_SHA=$(git rev-parse --short HEAD)
IMAGE_TAG="pr-${ghprbPullId}-${SHORT_SHA}"
echo "Expecting image tag ${IMAGE_TAG}"

set -e
# Deploy to an ephemeral namespace for testing
# We deploy rbac and override the image tag for insights-frontend-chrome
export IMAGE="quay.io/cloudservices/insights-chrome-frontend"
export GIT_COMMIT=master
export DEPLOY_FRONTENDS=true
source $CICD_ROOT/deploy_ephemeral_env.sh

echo "Taking a short nap to let the deployment stabilize"
sleep 60

echo "Running tests with CJI"
# Run some tests with ClowdJobInvocation
export IQE_IMAGE_TAG="platform-ui"
IQE_PLUGINS="platform_ui"
IQE_MARKER_EXPRESSION="smoke"
# Exclude progressive profile tests
# Exclude APIdocs tests
IQE_FILTER_EXPRESSION="not (test_progressive)"
IQE_ENV="ephemeral"
IQE_SELENIUM="true"
IQE_CJI_TIMEOUT="30m"
DEPLOY_TIMEOUT="900"  # 15min
DEPLOY_FRONTENDS="true"
source $CICD_ROOT/cji_smoke_test.sh


# Stubbed out for now
mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

# teardown docker
exit $BUILD_RESULTS
