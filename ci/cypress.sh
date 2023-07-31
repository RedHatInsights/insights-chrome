#!/bin/bash

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

docker run --name "${TEST_CONT}-${IMG_TAG}" -d -i "${CYPRESS_TEST_IMAGE}" /bin/bash

docker cp . "${TEST_CONT}-${IMG_TAG}:/e2e/"

podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "ls -lrd ."

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "ls -lrd ."
docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "ls -l *"
docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "whoami"

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"

docker exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test:ct"
