#!/bin/bash

TEST_CONT="${PROJECT_NAME}-unit-tests"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker run --name "${TEST_CONT}-${IMG_TAG}" -d -i --rm "${NODE_BASE_IMAGE}" /bin/sh

docker exec -it "${TEST_CONT}-${IMG_TAG}" ls -lrt
echo "copying..."
time docker cp . "${TEST_CONT}-${IMG_TAG}:/opt/app-root/src/"
docker exec -it "${TEST_CONT}-${IMG_TAG}" ls -lrt
echo "installing ..."
time docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"
docker exec -it "${TEST_CONT}-${IMG_TAG}" ls -lrt
echo "running tests..."
time docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test -- --coverage"
docker exec -it "${TEST_CONT}-${IMG_TAG}" ls -lrt
