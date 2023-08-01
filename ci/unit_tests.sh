#!/bin/bash

TEST_CONT="${PROJECT_NAME}-unit-tests"
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 
IMG_TAG=$(git rev-parse --short=8 HEAD)


docker run --name "${CONTAINER_NAME}" -d -t --rm "${NODE_BASE_IMAGE}"

docker exec "$CONTAINER_NAME" ls -lrt
docker exec "$CONTAINER_NAME" pwd
echo "copying..."
time docker cp . "${CONTAINER_NAME}:/opt/app-root/src/"
docker exec "$CONTAINER_NAME" ls -lrt
echo "installing ..."
time docker exec -i -w "/opt/app-root/src/" "$CONTAINER_NAME" sh -c "npm install"
docker exec "$CONTAINER_NAME" ls -lrt
echo "running tests..."
time docker exec -i -w "/opt/app-root/src/" "$CONTAINER_NAME" sh -c "npm run test -- --coverage"
docker exec "$CONTAINER_NAME" ls -lrt

docker stop "$CONTAINER_NAME"
