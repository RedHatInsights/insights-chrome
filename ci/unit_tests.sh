#!/bin/bash

TEST_CONT="${PROJECT_NAME}-unit-tests"
IMG_TAG=$(git rev-parse --short=8 HEAD)
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 
CONTAINER_WORKDIR="/opt/app-root/src"

docker run --name "$CONTAINER_NAME" -d --rm -t --entrypoint bash \
    -v "node_modules:${CONTAINER_WORKDIR}/node_modules" "${NODE_BASE_IMAGE}"

echo "copying..."
time docker cp ./. "${CONTAINER_NAME}:${CONTAINER_WORKDIR}"
echo "installing ..."
time docker exec -it "$CONTAINER_NAME" "npm install"
echo "running tests..."
time docker exec -it "$CONTAINER_NAME" "npm run test -- --coverage"

docker stop "$CONTAINER_NAME"
