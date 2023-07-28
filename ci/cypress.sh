#!/bin/bash

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

docker run --name "${TEST_CONT}-${IMG_TAG}" -d -i "${CYPRESS_BASE_IMAGE}" /bin/sh

docker cp . "${TEST_CONT}-${IMG_TAG}:/e2e/"

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "pwd"

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test:ct"
