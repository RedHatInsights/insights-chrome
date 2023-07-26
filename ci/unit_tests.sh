#!/bin/bash

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-unit-tests"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker run --name "${TEST_CONT}-${IMG_TAG}" -d -i "${NODE_BASE_IMAGE}" /bin/sh

docker cp . "${TEST_CONT}-${IMG_TAG}:/opt/app-root/src/"

docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"

docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test -- --coverage"
