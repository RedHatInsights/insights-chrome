#!/bin/bash

export COMPONENT="insights-chrome-frontend"
export IMAGE="quay.io/cloudservices/$COMPONENT"
export WORKSPACE=${WORKSPACE:-$APP_ROOT}  # if running in jenkins, use the build's workspace
export APP_ROOT=$(pwd)
export DIST_FOLDER=build
export INCLUDE_CHROME_CONFIG="true"
cat /etc/redhat-release
COMMON_BUILDER=https://raw.githubusercontent.com/RedHatInsights/insights-frontend-builder-common/master

# ---------------------------
# Build and Publish to Quay
# ---------------------------

set -ex


# get correct config build per build
ENV_BRANCH=$(sed "s/origin\///" <<< "$GIT_BRANCH")
if [[ $ENV_BRANCH == "master" ]]
then
  export CHROME_CONFIG_BRANCH="prod-beta"
else
  export CHROME_CONFIG_BRANCH=$(sed "s/master/prod/" <<< "$ENV_BRANCH")
fi

# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=$?

# Stubbed out for now
mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

# teardown docker
exit $BUILD_RESULTS
