#!/bin/bash

curl -sSL "${COMMON_BUILDER}/src/frontend-build.sh" > .frontend-build.sh
source ./.frontend-build.sh

BUILD_RESULTS=$?

if [[ $BUILD_RESULTS -ne 0 ]]; then
    exit $BUILD_RESULTS
fi
