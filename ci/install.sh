#!/bin/bash

TEST_CONT="${PROJECT_NAME}-install"
IMG_TAG=$(git rev-parse --short=8 HEAD)
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 

docker run --name "$CONTAINER_NAME" -d -i --rm "${NODE_BASE_IMAGE}" /bin/sh

docker cp -a . "${CONTAINER_NAME}:/opt/app-root/src/"

docker exec -i -w "/opt/app-root/src/" "$CONTAINER_NAME" sh -c "npm install"

docker cp -a "${CONTAINER_NAME}:/opt/app-root/src/node_modules" .

docker stop "$CONTAINER_NAME"
