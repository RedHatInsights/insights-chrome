#!/bin/bash

TEST_CONT="${PROJECT_NAME}-lint"
IMG_TAG=$(git rev-parse --short=8 HEAD)
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 

docker run --name "$CONTAINER_NAME" -d -i --rm "${NODE_BASE_IMAGE}" /bin/sh

docker cp . "${CONTAINER_NAME}:/opt/app-root/src/"

docker exec -i -w "/opt/app-root/src/" "$CONTAINER_NAME" sh -c "npm install"

docker exec -i -w "/opt/app-root/src/" "$CONTAINER_NAME" sh -c "npm run lint"
docker stop "$CONTAINER_NAME"
