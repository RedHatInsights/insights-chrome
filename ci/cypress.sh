#!/bin/bash

source ./ci/helpers.sh

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker build -t "${TEST_CONT}:${IMG_TAG}" -f Dockerfile.test .

docker run -i \
    "${TEST_CONT}:${IMG_TAG}" \
    npm run test:e2e
RESULT=$?

if [[ $RESULT -ne 0 ]]; then
    exit $RESULT
fi
